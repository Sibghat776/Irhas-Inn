import { HomepageBanner } from "../Models/HomepageBanner.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";

// ==========================================
// 1. GET BANNERS (Public) — active only, filterable by type
// ==========================================
export const getBanners = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const banners = await HomepageBanner.find(filter)
      .populate("categoryRef", "name slug")
      .sort({ order: 1 });

    res
      .status(200)
      .json(createSuccess(200, "Banners fetched successfully", banners));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET ALL BANNERS (Admin) — includes inactive
// ==========================================
export const getAllBannersAdmin = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const banners = await HomepageBanner.find(filter)
      .populate("categoryRef", "name slug")
      .sort({ order: 1 });

    res
      .status(200)
      .json(createSuccess(200, "All banners fetched successfully", banners));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. CREATE BANNER (Admin)
// ==========================================
export const createBanner = async (req, res, next) => {
  try {
    const { type, title, subtitle, tag, link, categoryRef, order, isActive } =
      req.body;

    if (!type || !["carousel", "categoryBanner", "brandBanner"].includes(type)) {
      return next(createError(400, "Valid type (carousel, categoryBanner, brandBanner) is required"));
    }

    if (!req.file) {
      return next(createError(400, "Image file is required"));
    }

    let result;
    try {
      result = await uploadToCloudinary(req.file.buffer, "irhasinn/HomepageBanners");
    } catch (error) {
      return next(createError(500, "Image upload failed"));
    }

    if (!result?.secure_url || !result?.public_id) {
      return next(createError(500, "Image upload returned incomplete data"));
    }

    const banner = new HomepageBanner({
      type,
      image: result.secure_url,
      imagePublicId: result.public_id,
      title: title || "",
      subtitle: subtitle || "",
      tag: tag || "",
      link: link || "",
      categoryRef: categoryRef || null,
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive === true || isActive === "true" : true,
    });

    await banner.save();

    res
      .status(201)
      .json(createSuccess(201, "Banner created successfully", banner));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. UPDATE BANNER (Admin)
// ==========================================
export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await HomepageBanner.findById(id);

    if (!banner) {
      return next(createError(404, "Banner not found"));
    }

    const { title, subtitle, tag, link, categoryRef, order, isActive } = req.body;

    // If a new image is uploaded, delete the old one from Cloudinary
    if (req.file) {
      try {
        if (banner.imagePublicId) {
          await deleteFromCloudinary(banner.imagePublicId);
        }
      } catch (cloudErr) {
        console.warn("Failed to delete old Cloudinary image:", cloudErr.message);
      }

      let result;
      try {
        result = await uploadToCloudinary(req.file.buffer, "irhasinn/HomepageBanners");
      } catch (error) {
        return next(createError(500, "Image upload failed"));
      }

      if (result?.secure_url && result?.public_id) {
        banner.image = result.secure_url;
        banner.imagePublicId = result.public_id;
      }
    }

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (tag !== undefined) banner.tag = tag;
    if (link !== undefined) banner.link = link;
    if (categoryRef !== undefined) banner.categoryRef = categoryRef || null;
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) {
      banner.isActive = isActive === true || isActive === "true";
    }

    await banner.save();

    res
      .status(200)
      .json(createSuccess(200, "Banner updated successfully", banner));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. DELETE BANNER (Admin)
// ==========================================
export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await HomepageBanner.findById(id);

    if (!banner) {
      return next(createError(404, "Banner not found"));
    }

    // Delete image from Cloudinary
    try {
      if (banner.imagePublicId) {
        await deleteFromCloudinary(banner.imagePublicId);
      }
    } catch (cloudErr) {
      console.warn("Failed to delete Cloudinary image:", cloudErr.message);
    }

    await HomepageBanner.findByIdAndDelete(id);

    res
      .status(200)
      .json(createSuccess(200, "Banner deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. REORDER BANNERS (Admin)
// ==========================================
export const reorderBanners = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of { id, order }

    if (!Array.isArray(items) || items.length === 0) {
      return next(createError(400, "Items array is required"));
    }

    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: Number(item.order) } },
      },
    }));

    await HomepageBanner.bulkWrite(operations);

    res
      .status(200)
      .json(createSuccess(200, "Banners reordered successfully"));
  } catch (error) {
    next(error);
  }
};
