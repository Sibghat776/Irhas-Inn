import express from "express";
import {
  subscribeUser,
  sendPushNotification,
  unsubscribeUser,
} from "../Controllers/pushNotificationController.js";
import { verifyAdmin, verifyToken } from "../utils/commonFunctions.js";

export const pushNotificationRoute = express.Router();

// Subscribe - logged in ya guest dono kar sakte hain
pushNotificationRoute.post("/subscribe", subscribeUser);

// Send notification - sirf admin
pushNotificationRoute.post("/send", verifyAdmin, sendPushNotification);

// Unsubscribe
pushNotificationRoute.post("/unsubscribe", unsubscribeUser);
