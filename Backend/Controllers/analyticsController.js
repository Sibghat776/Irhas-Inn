import { Order } from "../Models/Orders.js";
import { Product } from "../Models/Product.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";

// ==========================================
// GET /api/v1/analytics/summary  (admin only)
// Aggregates revenue, order counts, status breakdown,
// top-selling products, and daily revenue (last 30 days).
// Scoped to reseller's own products if role === "admin".
// ==========================================
export const getAnalyticsSummary = async (req, res, next) => {
  try {
    const isReseller = req.user.role === "admin";

    // For reseller: get their product IDs first
    let resellerProductIds = [];
    let orderMatchStage = {};
    if (isReseller) {
      resellerProductIds = await Product.find({ addedBy: req.user.id }).distinct("_id");
      orderMatchStage = { "orderItems.product": { $in: resellerProductIds } };
    }

    const [ordersAgg, statusAgg, topProductsAgg, totalProducts, totalUsers] =
      await Promise.all([
        // Revenue + order counts
        Order.aggregate([
          ...(isReseller ? [{ $match: orderMatchStage }] : []),
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalPrice" },
              totalOrders: { $sum: 1 },
              deliveredRevenue: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "Delivered"] },
                    "$totalPrice",
                    0,
                  ],
                },
              },
            },
          },
        ]),
        // Orders grouped by status
        Order.aggregate([
          ...(isReseller ? [{ $match: orderMatchStage }] : []),
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        // Top-selling products (by quantity sold)
        Order.aggregate([
          ...(isReseller ? [{ $match: orderMatchStage }] : []),
          { $unwind: "$orderItems" },
          ...(isReseller ? [{ $match: { "orderItems.product": { $in: resellerProductIds } } }] : []),
          {
            $group: {
              _id: "$orderItems.product",
              unitsSold: { $sum: "$orderItems.quantity" },
              revenue: {
                $sum: {
                  $multiply: [
                    "$orderItems.quantity",
                    { $ifNull: ["$orderItems.product.price", 0] },
                  ],
                },
              },
            },
          },
          { $sort: { unitsSold: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              name: "$product.name",
              image: { $arrayElemAt: ["$product.images.url", 0] },
              unitsSold: 1,
              revenue: 1,
            },
          },
        ]),
        isReseller
          ? Product.countDocuments({ addedBy: req.user.id })
          : Product.countDocuments(),
        isReseller
          ? Order.find(orderMatchStage).distinct("user")
          : Order.distinct("user"),
      ]);

    const totals = ordersAgg[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      deliveredRevenue: 0,
    };

    const byStatus = {};
    statusAgg.forEach((s) => {
      byStatus[s._id] = s.count;
    });

    // Revenue over time (daily, last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const revenueOverTime = await Order.aggregate([
      {
        $match: {
          ...(isReseller ? orderMatchStage : {}),
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = {
      totalRevenue: totals.totalRevenue || 0,
      deliveredRevenue: totals.deliveredRevenue || 0,
      totalOrders: totals.totalOrders || 0,
      totalProducts,
      totalCustomers: totalUsers.length,
      byStatus,
      topProducts: topProductsAgg,
      revenueOverTime,
    };

    return res
      .status(200)
      .json(createSuccess(200, "Analytics summary fetched", summary));
  } catch (error) {
    next(error);
  }
};
