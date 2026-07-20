import { Order } from "../Models/Orders.js";
import { Product } from "../Models/Product.js";
import Users from "../Models/Users.js";
import { Notification } from "../Models/Notification.js";
import { sendPushToUser } from "./pushNotificationController.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";

const populateOrder = (query) =>
  query
    .populate("user", "username email phoneNo profilePic")
    .populate({
      path: "orderItems.product",
      select: "name slug price images stock description category brand",
      populate: {
        path: "category",
        select: "name",
      },
    });

// Helper: Assign serial numbers to old orders missing them
const assignMissingSerialNumbers = async () => {
  const ordersWithoutSerial = await Order.find({ serialNumber: { $exists: false } }).sort({ createdAt: 1 });
  if (ordersWithoutSerial.length === 0) return;

  const lastOrder = await Order.findOne({ serialNumber: { $exists: true } }).sort({ serialNumber: -1 });
  let currentSerial = lastOrder ? lastOrder.serialNumber : 1000;

  for (const order of ordersWithoutSerial) {
    currentSerial++;
    order.serialNumber = currentSerial;
    await order.save({ validateBeforeSave: false });
  }
  console.log(`[Migration] Assigned serial numbers to ${ordersWithoutSerial.length} old orders`);
};

// ==========================================
// 1. CREATE ORDER
// ==========================================
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return next(createError(400, "Order items are required"));
    }

    if (!shippingAddress) {
      return next(createError(400, "Shipping address is required"));
    }

    // Validate stock availability for each item before creating order
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) return next(createError(404, `Product ${item.product} not found`));
      if (product.stock < item.quantity) {
        return next(createError(400, `Product ${product.name} has only ${product.stock} items in stock`));
      }
    }

    // Generate serial number
    const lastOrder = await Order.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
    const serialNumber = (lastOrder && typeof lastOrder.serialNumber === "number") ? lastOrder.serialNumber + 1 : 1001;

    const order = await Order.create({
      serialNumber,
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      itemsPrice,
      shippingPrice,
      totalPrice,
      status: "Pending",
      trackingHistory: [{ status: "Pending", timestamp: new Date() }],
    });
    
    await Users.findByIdAndUpdate(req.user.id, { cart: [] });

    // Decrement stock and increment sold count for each product
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.sold = (product.sold || 0) + item.quantity;
        await product.save();
      }
    }

    console.log(`[Order Created]: ${order._id} for user ${req.user.id}`);

    // In-app notification for the customer
    try {
      await Notification.create({
        userId: req.user.id,
        title: "Order Placed",
        message: `Your order #${order._id.toString().slice(-8)} has been placed successfully. We'll notify you as it progresses.`,
        orderId: order._id,
      });
    } catch (notifErr) {
      console.error(`[Notification Failed]: For user ${req.user.id} -`, notifErr.message);
    }

    // Web Push to the customer's subscribed devices
    try {
      const link = `/profile/orders/${order._id}`;
      const result = await sendPushToUser(req.user.id, {
        title: "Order Placed 🎉",
        body: `Your order #${order._id.toString().slice(-8)} has been placed successfully.`,
        link,
      });
      console.log(`[Push Sent]: For user ${req.user.id} - sent ${result.sent}, removed ${result.removed}`);
    } catch (pushErr) {
      console.error(`[Push Failed]: For user ${req.user.id} -`, pushErr.message);
    }

    // ==========================================
    // [Reseller Notification] Notify each reseller whose product(s) were ordered.
    // Non-blocking: any failure here must NEVER break order creation.
    // ==========================================
    try {
      console.log(`[Reseller Notification] Checking resellers for order ${order._id}`);

      // Map each reseller to the list of their ordered product names in THIS order.
      const resellerItems = new Map(); // resellerId -> string[] of product names

      for (const item of orderItems) {
        const product = await Product.findById(item.product).select("name addedBy").lean();
        if (!product) {
          console.log(`[Reseller Notification] Product ${item.product} not found, skipping`);
          continue;
        }
        const addedBy = product.addedBy ? product.addedBy.toString() : null;
        if (!addedBy) {
          // null/undefined addedBy => superadmin product, skip
          console.log(`[Reseller Notification] Product "${product.name}" has no reseller (addedBy), skipping`);
          continue;
        }
        if (!resellerItems.has(addedBy)) resellerItems.set(addedBy, []);
        for (let i = 0; i < (item.quantity || 1); i++) {
          resellerItems.get(addedBy).push(product.name);
        }
      }

      console.log(`[Reseller Notification] Unique resellers to notify: ${resellerItems.size}`);

      for (const [resellerId, productNames] of resellerItems.entries()) {
        const uniqueNames = [...new Set(productNames)];
        const itemCount = productNames.length;
        const noun = itemCount === 1 ? "item" : "items";
        const title = "New Order Received! 🛒";
        const body = `New order! ${itemCount} ${noun} from your store were just ordered${
          uniqueNames.length <= 3 ? `: ${uniqueNames.join(", ")}` : `.`
        }`;
        const link = `/Admin/Orders`;

        try {
          await Notification.create({
            userId: resellerId,
            title,
            message: body,
            orderId: order._id,
          });
          console.log(`[Reseller Notification] In-app Notification created for reseller ${resellerId}`);

          const pushResult = await sendPushToUser(resellerId, { title, body, link });
          console.log(
            `[Reseller Notification] Web push sent for reseller ${resellerId} - sent ${pushResult.sent}, removed ${pushResult.removed}`
          );
        } catch (resellerErr) {
          console.error(
            `[Reseller Notification] Failed for reseller ${resellerId} -`,
            resellerErr.message
          );
        }
      }
      console.log(`[Reseller Notification] Done for order ${order._id}`);
    } catch (resellerBlockErr) {
      console.error(`[Reseller Notification] Block-level error (non-fatal) -`, resellerBlockErr.message);
    }

    return res
      .status(201)
      .json(createSuccess(201, "Order created successfully", order));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET LOGGED IN USER ORDERS
// ==========================================
export const getMyOrders = async (req, res, next) => {
  try {
    console.log(`[Order Route]: Fetching orders for user ${req.user.id}`);

    await assignMissingSerialNumbers();

    const orders = await populateOrder(
      Order.find({ user: req.user.id }).sort({ createdAt: -1 }),
    );

    return res
      .status(200)
      .json(createSuccess(200, "Your orders fetched successfully", orders));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET SINGLE ORDER BY ID
// ==========================================
export const getOrderById = async (req, res, next) => {
  try {
    const order = await populateOrder(Order.findById(req.params.id));

    if (!order) {
      return next(createError(404, "Order not found"));
    }

    if (
      order.user._id.toString() !== req.user.id.toString() &&
      !req.user.isAdmin
    ) {
      return next(createError(401, "You are not authorized"));
    }

    return res
      .status(200)
      .json(createSuccess(200, "Order fetched successfully", order));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC ORDER TRACKING (no auth) - used by QR code on printed reports
// ==========================================
export const trackOrder = async (req, res, next) => {
  try {
    const order = await populateOrder(Order.findById(req.params.id));

    if (!order) {
      return next(createError(404, "Order not found"));
    }

    // Expose full details (per store policy) but always read-only.
    const tracking = {
      _id: order._id,
      serialNumber: order.serialNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      trackingHistory: order.trackingHistory,
      shippingAddress: order.shippingAddress,
      orderItems: (order.orderItems || []).map((item) => ({
        quantity: item.quantity,
        product: item.product
          ? {
              name: item.product.name,
              price: item.product.price,
              images: item.product.images,
              slug: item.product.slug,
            }
          : null,
      })),
    };

    return res
      .status(200)
      .json(createSuccess(200, "Order tracking fetched successfully", tracking));
  } catch (error) {
    next(error);
  }
};


// ==========================================
// 4. GET ALL ORDERS (ADMIN)
// ==========================================
export const getAllOrders = async (req, res, next) => {
  try {
    await assignMissingSerialNumbers();

    let orders;
    if (req.user.role === "admin") {
      // Reseller: only orders containing at least one of their products
      const resellerProductIds = await Product.find({ addedBy: req.user.id }).distinct("_id");
      orders = await populateOrder(
        Order.find({ "orderItems.product": { $in: resellerProductIds } }).sort({ createdAt: -1 })
      );
    } else {
      orders = await populateOrder(Order.find({}).sort({ createdAt: -1 }));
    }

    return res
      .status(200)
      .json(createSuccess(200, "All orders fetched successfully", orders));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. UPDATE ORDER STATUS (ADMIN) - with Notification
// ==========================================
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`[Order Status Update]: Admin updating order ${orderId} to ${status}`);

    if (!status) {
      return next(createError(400, "Status is required"));
    }

    const validStatuses = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(createError(404, "Order not found"));
    }

    // Ownership check for reseller admins
    if (req.user.role === "admin") {
      const resellerProductIds = await Product.find({ addedBy: req.user.id }).distinct("_id");
      const hasOwnership = order.orderItems.some((item) =>
        resellerProductIds.some((pid) => pid.toString() === item.product?.toString())
      );
      if (!hasOwnership) {
        return next(createError(403, "You can only update orders containing your products"));
      }
    }

    order.status = status;
    order.trackingHistory.push({ status, timestamp: new Date() });
    await order.save();

    // Create notification for the user
    const title = `Order ${status}`;
    const message = `Your order #${order._id.toString().slice(-8)} has been updated to "${status}".`;
    await Notification.create({
      userId: order.user,
      title,
      message,
    });

    console.log(`[Notification Created]: For user ${order.user} - ${title}`);

    // Also fire a Web Push notification to the user's subscribed devices
    try {
      const link = `/profile/orders/${order._id}`;
      const result = await sendPushToUser(order.user, { title, body: message, link });
      console.log(`[Push Sent]: For user ${order.user} - sent ${result.sent}, removed ${result.removed}`);
    } catch (pushErr) {
      console.error(`[Push Failed]: For user ${order.user} -`, pushErr.message);
    }

    return res
      .status(200)
      .json(createSuccess(200, "Order status updated successfully", order));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. UPDATE ORDER (ADMIN) - Legacy
// ==========================================
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(createError(404, "Order not found"));
    }

    const {
      paymentStatus,
      isPaid,
      paidAt,
      isDelivered,
      deliveredAt,
      orderStatus,
    } = req.body;

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (typeof isPaid === "boolean") order.isPaid = isPaid;
    if (paidAt !== undefined) order.paidAt = paidAt || null;
    if (typeof isDelivered === "boolean") order.isDelivered = isDelivered;
    if (deliveredAt !== undefined) order.deliveredAt = deliveredAt || null;
    if (orderStatus) order.orderStatus = orderStatus;

    await order.save();

    return res
      .status(200)
      .json(createSuccess(200, "Order updated successfully", order));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. DELETE ORDER (ADMIN)
// ==========================================
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return next(createError(404, "Order not found"));
    }

    return res
      .status(200)
      .json(createSuccess(200, "Order deleted successfully"));
  } catch (error) {
    next(error);
  }
};
