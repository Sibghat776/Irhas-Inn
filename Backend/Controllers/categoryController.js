import { Category } from "../Models/Category.js";
import { Product } from "../Models/Product.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";
import { createSlug } from "../utils/commonFunctions.js";

// ==========================================
// 1. CREATE CATEGORY
// ==========================================
export const createCategory = async (req, res, next) => {
  try {
    // 1. req.body se image bhi extract karein
    const { description, name } = req.body;
    let result;
    console.log(req.user);
    const file = req.file;
    try {
      result = await uploadToCloudinary(file.buffer, "irhasinn/Category");
    } catch (error) {
      return next(createError(500, "Image upload failed"));
    }
    if (!name || !description || !result?.url || !result?.public_id) {
      return next(
        createError(
          400,
          "All fields (name, description, and image) are required",
        ),
      );
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return next(createError(400, "Category already exists"));
    }

    if (!req.user || !req.user.id) {
      return next(
        createError(401, "You are not authenticated! Missing user info."),
      );
    }

    const image = result.secure_url;
    const category = new Category({
      name,
      description,
      image,
      slug: createSlug(name),
      user: req.user.id,
      products: [],
    });

    await category.save();

    res
      .status(201)
      .json(createSuccess(201, "Category created successfully", category));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET ALL CATEGORIES
// ==========================================
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate("user", "username email")
      .populate("products");

    res
      .status(200)
      .json(createSuccess(200, "Categories fetched successfully", categories));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET SINGLE CATEGORY (BY ID)
// ==========================================
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("user", "username email")
      .populate("products");

    if (!category) {
      return next(createError(404, "Category not found"));
    }

    res.status(200).json(createSuccess(200, "Category found", category));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. GET CATEGORY BY SLUG (SEO FRIENDLY)
// ==========================================
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate("user", "username email")
      .populate("products");

    if (!category) {
      return next(createError(404, "Category not found"));
    }

    res.status(200).json(createSuccess(200, "Category found", category));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. UPDATE CATEGORY
// ==========================================
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(createError(404, "Category not found"));
    }

    // 1. Destructure image from req.body
    const { description, name, isActive, image } = req.body;

    if (name) {
      category.name = name;
      category.slug = createSlug(name);
    }

    if (description) {
      category.description = description;
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    if (req.file) {
      let result;
      try {
        result = await uploadToCloudinary(req.file.buffer, "irhasinn/Category");
      } catch (error) {
        return next(createError(500, "Image upload failed"));
      }
      if (result?.secure_url) {
        category.image = result.secure_url;
      }
    }

    await category.save();

    res
      .status(200)
      .json(createSuccess(200, "Category updated successfully", category));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. DELETE CATEGORY
// ==========================================
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(createError(404, "Category not found"));
    }

    const productsCount = await Product.countDocuments({
      category: category._id,
    });

    if (productsCount > 0) {
      return next(
        createError(
          400,
          "Cannot delete category with products. Remove products first.",
        ),
      );
    }

    // Note: Yahan par category delete karne se pehle, uski image ko cloud storage se
    // delete karne ki logic lagani chahiye using 'category.image.public_id'

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json(createSuccess(200, "Category deleted successfully"));
  } catch (error) {
    next(error);
  }
};
