import { Notification } from "../Models/Notification.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";

// ==========================================
// 1. GET LOGGED-IN USER NOTIFICATIONS
// ==========================================
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort(
      { createdAt: -1 },
    );

    return res
      .status(200)
      .json(
        createSuccess(200, "Notifications fetched successfully", notifications),
      );
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. MARK ALL NOTIFICATIONS AS READ
// ==========================================
export const markNotificationsAsRead = async (req, res, next) => {
  try {
    console.log(
      `[Notification Route Triggered]: Mark as read for user ${req.user.id}`,
    );

    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } },
    );

    return res
      .status(200)
      .json(createSuccess(200, "Notifications marked as read"));
  } catch (error) {
    next(error);
  }
};
