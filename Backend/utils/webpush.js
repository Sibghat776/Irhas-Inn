import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:ullahsibghat786@gmail.com",
  process.env.VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY_HERE",
  process.env.VAPID_PRIVATE_KEY || "YOUR_VAPID_PRIVATE_KEY_HERE"
);

// Single subscription ko push notification bhejta hai
export const sendToSubscription = async (subscription, payload) => {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.auth,
      p256dh: subscription.p256dh,
    },
  };

  try {
    return await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    console.log(process.env.VAPID_PUBLIC_KEY);
    console.log(process.env.VAPID_PRIVATE_KEY);
  } catch (err) {
    console.error("❌ webpush.sendNotification failed for endpoint:", subscription.endpoint);
    console.error("   statusCode:", err?.statusCode);
    console.error("   body      :", err?.body);
    console.error("   message   :", err?.message);
    console.error("   full error:", err);
    throw err;
  }
};

export default webpush;
