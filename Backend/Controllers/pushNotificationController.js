import { PushSubscription } from "../Models/PushSubscription.js";
import Users from "../Models/Users.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";
import { sendToSubscription } from "../utils/webpush.js";

// ==========================================
// 1. SUBSCRIBE - subscription save karna
// ==========================================
export const subscribeUser = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return next(createError(400, "Invalid subscription object"));
    }

    const userId = req.user?.id || null;

    // Duplicate check - same endpoint already exist kare to update karo
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, auth: keys.auth, p256dh: keys.p256dh, userId },
      { upsert: true, new: true }
    );

    return res.status(201).json(createSuccess(201, "Subscribed successfully"));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2b. SEND NOTIFICATION TO A SINGLE USER (by userId)
// Used for transactional pushes like order status updates.
// ==========================================
export const sendPushToUser = async (userId, { title, body, link = "/" }) => {
  if (!userId || !title || !body) return { sent: 0, removed: 0 };

  const subscriptions = await PushSubscription.find({ userId });
  if (subscriptions.length === 0) return { sent: 0, removed: 0 };

  const payload = { title, body, link };
  const invalidEndpoints = [];
  let sent = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await sendToSubscription(sub, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          invalidEndpoints.push(sub.endpoint);
        } else {
          console.error(
            `⚠️ sendPushToUser failed (status ${err?.statusCode}) for ${sub.endpoint}:`,
            err?.body || err?.message
          );
        }
      }
    })
  );

  if (invalidEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: invalidEndpoints } });
  }

  return { sent, removed: invalidEndpoints.length };
};

// ==========================================
// 2c. SEND NOTIFICATION TO ALL ADMINS
// Used when a new contact/message arrives that admins should know about.
// ==========================================
export const sendPushToAdmins = async ({ title, body, link = "/" }) => {
  if (!title || !body) return { sent: 0, removed: 0 };

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) return { sent: 0, removed: 0 };

  const admins = await Users.find({ email: { $in: adminEmails } }, "_id");
  if (admins.length === 0) return { sent: 0, removed: 0 };

  const adminIds = admins.map((a) => a._id);
  const subscriptions = await PushSubscription.find({ userId: { $in: adminIds } });
  if (subscriptions.length === 0) return { sent: 0, removed: 0 };

  const payload = { title, body, link };
  const invalidEndpoints = [];
  let sent = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await sendToSubscription(sub, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          invalidEndpoints.push(sub.endpoint);
        } else {
          console.error(
            `⚠️ sendPushToAdmins failed (status ${err?.statusCode}) for ${sub.endpoint}:`,
            err?.body || err?.message
          );
        }
      }
    })
  );

  if (invalidEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: invalidEndpoints } });
  }

  return { sent, removed: invalidEndpoints.length };
};

// ==========================================
// 2. SEND NOTIFICATION - sab users ko bhejta hai (admin only)
// ==========================================
export const sendPushNotification = async (req, res, next) => {
  try {
    const { title, body, link = "/" } = req.body;

    if (!title || !body) {
      return next(createError(400, "title and body are required"));
    }

    const subscriptions = await PushSubscription.find();

    if (subscriptions.length === 0) {
      return res.status(200).json(createSuccess(200, "No subscribers found", { sent: 0 }));
    }

    const payload = { title, body, link };
    const invalidEndpoints = [];
    let sent = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await sendToSubscription(sub, payload);
          sent++;
        } catch (err) {
          // 410 Gone ya 404 = subscription expired/invalid, delete karo
          if (err.statusCode === 410 || err.statusCode === 404) {
            invalidEndpoints.push(sub.endpoint);
          } else {
            console.error(
              `⚠️ sendPushNotification failed (status ${err?.statusCode}) for ${sub.endpoint}:`,
              err?.body || err?.message
            );
          }
        }
      })
    );

    // Invalid subscriptions clean up
    if (invalidEndpoints.length > 0) {
      await PushSubscription.deleteMany({ endpoint: { $in: invalidEndpoints } });
    }

    return res.status(200).json(
      createSuccess(200, "Notifications sent", { sent, removed: invalidEndpoints.length })
    );
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. UNSUBSCRIBE - subscription delete karna
// ==========================================
export const unsubscribeUser = async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) return next(createError(400, "endpoint is required"));

    await PushSubscription.findOneAndDelete({ endpoint });

    return res.status(200).json(createSuccess(200, "Unsubscribed successfully"));
  } catch (error) {
    next(error);
  }
};
