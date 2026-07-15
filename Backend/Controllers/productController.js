import { Product } from "../Models/Product.js";
import { Category } from "../Models/Category.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";
import { queueSocialPost } from "./socialPostController.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import slugify from "slugify";

// ==================== UTILITY FUNCTIONS ====================

const parseArray = (value) => {
  try {
    if (!value) return [];
    if (typeof value === "string") {
      if (value.includes(",")) {
        return value.split(",").map((item) => item.trim());
      }
    }
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return [];
  }
};

const generateSlug = async (name) => {
  let slug = slugify(name, { lower: true, strict: true });
  let existingProduct = await Product.findOne({ slug });
  let counter = 1;

  while (existingProduct) {
    slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
    existingProduct = await Product.findOne({ slug });
    counter++;
  }

  return slug;
};

// ==================== 1. CREATE PRODUCT (ADMIN) ====================

export const addProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      colors,
      sizes,
      tags,
    } = req.body;

    // Validation
    if (!name?.trim()) {
      return next(createError(400, "Product name is required"));
    }

    if (!description?.trim()) {
      return next(createError(400, "Product description is required"));
    }

    if (!price || price <= 0) {
      return next(createError(400, "Valid product price is required"));
    }

    if (!category) {
      return next(createError(400, "Category is required"));
    }

    if (!brand?.trim()) {
      return next(createError(400, "Brand is required"));
    }

    if (!req.files || req.files.length === 0) {
      return next(createError(400, "At least one product image is required"));
    }

    // Check category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(createError(404, "Category not found"));
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    try {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "zeef/products");
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    } catch (uploadError) {
      return next(createError(500, "Image upload failed"));
    }
    console.log('📸 Uploaded image URLs:', uploadedImages.map(img => img.url));

    // Generate unique slug
    const slug = await generateSlug(name);

    // Create product
    console.log(req.user)
    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      brand: brand.trim(),
      price: Number(price),
      category,
      stock: Number(stock) || 0,
      colors: parseArray(colors),
      sizes: parseArray(sizes),
      tags: parseArray(tags),
      images: uploadedImages,
      user: req.user.id,
    });

    // Add product to category
    await Category.findByIdAndUpdate(
      category,
      { $push: { products: product._id } },
      { new: true },
    );

    // Populate before returning
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("user", "username email");

    console.log('✅ Product created, ID:', product._id);
    console.log('🛎️ Enqueuing social media post job');
    queueSocialPost(product._id).catch(err => {
      console.error('❌ Failed to enqueue social post job:', err);
    });
    res
      .status(201)
      .json(
        createSuccess(201, "Product created successfully", populatedProduct),
      );
  } catch (error) {
    next(error);
  }
};

// ==================== 2. GET ALL PRODUCTS (WITH FILTERS & PAGINATION) ====================

export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      brand,
      page = 1,
      limit = 12,
      sort,
    } = req.query;

    const filter = {};

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Search filter (name, description, tags)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Brand filter
    if (brand) {
      filter.brand = { $regex: brand, $options: "i" };
    }

    // Stock filter (only in-stock products)
    filter.stock = { $gt: 0 };

    // Sorting options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort) {
      switch (sort) {
        case "price-low":
          sortOption = { price: 1 };
          break;
        case "price-high":
          sortOption = { price: -1 };
          break;
        case "rating":
          sortOption = { averageRating: -1 };
          break;
        case "popular":
          sortOption = { sold: -1 };
          break;
        case "trending":
          sortOption = { "ratings.length": -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("user", "username email")
      .populate("ratings.user", "username avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json(
      createSuccess(200, "Products fetched successfully", {
        products,
        pagination: {
          totalProducts,
          currentPage: pageNum,
          totalPages: Math.ceil(totalProducts / limitNum),
          hasNextPage: pageNum < Math.ceil(totalProducts / limitNum),
          hasPrevPage: pageNum > 1,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// ==================== 3. GET SINGLE PRODUCT BY ID ====================

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name slug description")
      .populate("user", "username email avatar")
      .populate("ratings.user", "username email avatar");

    if (!product) {
      return next(createError(404, "Product not found"));
    }

    res.status(200).json(createSuccess(200, "Product found", product));
  } catch (error) {
    next(error);
  }
};

// ==================== 4. GET PRODUCT BY SLUG ====================

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate("category", "name slug")
      .populate("user", "username email avatar")
      .populate("ratings.user", "username email avatar");

    if (!product) {
      return next(createError(404, "Product not found"));
    }

    res.status(200).json(createSuccess(200, "Product found", product));
  } catch (error) {
    next(error);
  }
};

// ==================== 5. RATE PRODUCT ====================

export const rateProduct = async (req, res, next) => {
  try {
    const { star, comment } = req.body;
    const { id: productId } = req.params;
    const userId = req.user.id;

    // Validate rating
    if (!star || star < 1 || star > 5) {
      return next(createError(400, "Star rating must be between 1 and 5"));
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    // Check if user already rated this product
    const existingRatingIndex = product.ratings.findIndex(
      (r) => r.user.toString() === userId.toString(),
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      product.ratings[existingRatingIndex].star = star;
      product.ratings[existingRatingIndex].comment =
        comment || product.ratings[existingRatingIndex].comment;
      product.ratings[existingRatingIndex].reviewDate = new Date();
    } else {
      // Add new rating
      product.ratings.push({
        user: userId,
        star: Number(star),
        comment: comment?.trim() || "",
        reviewDate: new Date(),
      });
    }

    // Calculate average rating
    const totalStars = product.ratings.reduce(
      (acc, item) => acc + item.star,
      0,
    );
    product.averageRating =
      Math.round((totalStars / product.ratings.length) * 10) / 10;
    product.totalReviews = product.ratings.length;

    await product.save();

    // Populate before returning
    const updatedProduct = await Product.findById(productId).populate(
      "ratings.user",
      "username email avatar",
    );

    res
      .status(200)
      .json(createSuccess(200, "Rating added successfully", updatedProduct));
  } catch (error) {
    next(error);
  }
};

// ==================== 6. DELETE RATING/REVIEW ====================

export const deleteRating = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    const ratingIndex = product.ratings.findIndex(
      (r) => r.user.toString() === userId.toString(),
    );

    if (ratingIndex === -1) {
      return next(createError(404, "Rating not found"));
    }

    product.ratings.splice(ratingIndex, 1);

    // Recalculate average rating
    if (product.ratings.length > 0) {
      const totalStars = product.ratings.reduce(
        (acc, item) => acc + item.star,
        0,
      );
      product.averageRating =
        Math.round((totalStars / product.ratings.length) * 10) / 10;
    } else {
      product.averageRating = 0;
    }

    product.totalReviews = product.ratings.length;
    await product.save();

    res.status(200).json(createSuccess(200, "Rating deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ==================== 7. GET PRODUCT REVIEWS ====================

export const getProductReviews = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { page = 1, limit = 10, sort = "latest" } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    let ratings = [...product.ratings];

    // Sort reviews
    if (sort === "latest") {
      ratings.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
    } else if (sort === "highest") {
      ratings.sort((a, b) => b.star - a.star);
    } else if (sort === "lowest") {
      ratings.sort((a, b) => a.star - b.star);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const reviews = ratings.slice(skip, skip + limitNum);

    res.status(200).json(
      createSuccess(200, "Reviews fetched successfully", {
        reviews,
        totalReviews: product.ratings.length,
        currentPage: pageNum,
        totalPages: Math.ceil(product.ratings.length / limitNum),
      }),
    );
  } catch (error) {
    next(error);
  }
};

// ==================== 8. UPDATE PRODUCT ====================

export const updateProduct = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      colors,
      sizes,
      tags,
      removeImageIds,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    // Update basic fields
    if (name?.trim()) {
      product.name = name.trim();
      // Generate new slug if name changed
      product.slug = await generateSlug(name);
    }

    if (description?.trim()) product.description = description.trim();
    if (brand?.trim()) product.brand = brand.trim();
    if (price && price > 0) product.price = Number(price);
    if (stock !== undefined) product.stock = Math.max(0, Number(stock));

    // Update arrays
    if (colors) product.colors = parseArray(colors);
    if (sizes) product.sizes = parseArray(sizes);
    if (tags) product.tags = parseArray(tags);

    // Handle category change
    if (category && category !== product.category.toString()) {
      await Category.findByIdAndUpdate(product.category, {
        $pull: { products: productId },
      });
      product.category = category;
      await Category.findByIdAndUpdate(category, {
        $push: { products: productId },
      });
    }

    // Handle image deletion
    if (removeImageIds && Array.isArray(removeImageIds)) {
      for (const publicId of removeImageIds) {
        await deleteFromCloudinary(publicId);
      }
      product.images = product.images.filter(
        (img) => !removeImageIds.includes(img.public_id),
      );
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer, "zeef/products");
          product.images.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      } catch (uploadError) {
        return next(createError(500, "Image upload failed"));
      }
    }

    await product.save();

    const updatedProduct = await Product.findById(productId)
      .populate("category", "name slug")
      .populate("user", "username email")
      .populate("ratings.user", "username avatar");

    res
      .status(200)
      .json(createSuccess(200, "Product updated successfully", updatedProduct));
  } catch (error) {
    next(error);
  }
};

// ==================== 9. DELETE PRODUCT ====================

export const deleteProduct = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, "Product not found"));
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        for (const image of product.images) {
          await deleteFromCloudinary(image.public_id);
        }
      } catch (deleteError) {
        console.error("Error deleting images from Cloudinary:", deleteError);
      }
    }

    // Remove product from category
    await Category.findByIdAndUpdate(product.category, {
      $pull: { products: productId },
    });

    // Delete product
    await Product.findByIdAndDelete(productId);

    res.status(200).json(createSuccess(200, "Product deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ==================== 10. GET TRENDING PRODUCTS ====================

export const getTrendingProducts = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ stock: { $gt: 0 } })
      .populate("category", "name slug")
      .populate("user", "username email")
      .sort({ sold: -1, averageRating: -1 })
      .limit(Number(limit));

    res
      .status(200)
      .json(createSuccess(200, "Trending products fetched", products));
  } catch (error) {
    next(error);
  }
};

// ==================== 11. GET TOP RATED PRODUCTS ====================

export const getTopRatedProducts = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      stock: { $gt: 0 },
      averageRating: { $gt: 0 },
    })
      .populate("category", "name slug")
      .populate("user", "username email")
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(Number(limit));

    res
      .status(200)
      .json(createSuccess(200, "Top rated products fetched", products));
  } catch (error) {
    next(error);
  }
};

// ==================== 12. GET RECOMMENDED PRODUCTS ====================

export const getRecommendedProducts = async (req, res, next) => {
  try {
    const { categoryId, limit = 8 } = req.query;

    if (!categoryId) {
      return next(createError(400, "Category ID is required"));
    }

    const products = await Product.find({
      category: categoryId,
      stock: { $gt: 0 },
    })
      .populate("category", "name slug")
      .populate("user", "username email")
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(Number(limit));

    res
      .status(200)
      .json(createSuccess(200, "Recommended products fetched", products));
  } catch (error) {
    next(error);
  }
};

// ==================== 13. BULK UPDATE PRODUCT STOCK ====================

export const bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body; // [{id, stock}, {id, stock}, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      return next(createError(400, "Updates array is required"));
    }

    const updatedProducts = [];

    for (const update of updates) {
      const { id, stock } = update;
      const product = await Product.findByIdAndUpdate(
        id,
        { stock: Math.max(0, Number(stock)) },
        { new: true },
      );
      if (product) updatedProducts.push(product);
    }

    res.status(200).json(
      createSuccess(200, "Stock updated successfully", {
        updated: updatedProducts.length,
        products: updatedProducts,
      }),
    );
  } catch (error) {
    next(error);
  }
};

// ==================== 14. GET PRODUCT STATISTICS ====================

export const getProductStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const productsInStock = await Product.countDocuments({ stock: { $gt: 0 } });
    const productsOutOfStock = await Product.countDocuments({ stock: 0 });
    const averagePrice = await Product.aggregate([
      { $group: { _id: null, avg: { $avg: "$price" } } },
    ]);
    const averageRating = await Product.aggregate([
      { $group: { _id: null, avg: { $avg: "$averageRating" } } },
    ]);
    const totalSold = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$sold" } } },
    ]);
    const totalReviews = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$totalReviews" } } },
    ]);

    res.status(200).json(
      createSuccess(200, "Product statistics fetched", {
        totalProducts,
        productsInStock,
        productsOutOfStock,
        averagePrice: averagePrice[0]?.avg || 0,
        averageRating: averageRating[0]?.avg || 0,
        totalSold: totalSold[0]?.total || 0,
        totalReviews: totalReviews[0]?.total || 0,
      }),
    );
  } catch (error) {
    next(error);
  }
};

// ==================== 15. SEARCH PRODUCTS (TEXT SEARCH) ====================

export const searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q || q.trim().length === 0) {
      return next(createError(400, "Search query is required"));
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } },
    )
      .populate("category", "name slug")
      .populate("user", "username email")
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limitNum);

    const totalResults = await Product.countDocuments({
      $text: { $search: q },
    });

    res.status(200).json(
      createSuccess(200, "Search results", {
        products,
        pagination: {
          totalResults,
          currentPage: pageNum,
          totalPages: Math.ceil(totalResults / limitNum),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// ==================== 16. GET PRODUCTS BY CATEGORY ====================

export const getProductsByCategory = async (req, res, next) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 12, sort = "latest" } = req.query;

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return next(createError(404, "Category not found"));
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { averageRating: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find({
      category: category._id,
      stock: { $gt: 0 },
    })
      .populate("category", "name slug")
      .populate("user", "username email")
      .populate("ratings.user", "username avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalProducts = await Product.countDocuments({
      category: category._id,
      stock: { $gt: 0 },
    });

    res.status(200).json(
      createSuccess(200, "Category products fetched", {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
        },
        products,
        pagination: {
          totalProducts,
          currentPage: pageNum,
          totalPages: Math.ceil(totalProducts / limitNum),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
};

// ==================== 17. UPDATE PRODUCT SOLD COUNT ====================

export const incrementProductSold = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { quantity = 1 } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { sold: Number(quantity), stock: -Number(quantity) } },
      { new: true },
    );

    if (!product) {
      return next(createError(404, "Product not found"));
    }

    res
      .status(200)
      .json(createSuccess(200, "Product sold count updated", product));
  } catch (error) {
    next(error);
  }
};
