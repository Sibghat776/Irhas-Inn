import express from "express";
import {
  getNotifications,
  markNotificationsAsRead,
} from "../Controllers/notificationController.js";
import { verifyToken } from "../utils/commonFunctions.js";

export const notificationRoute = express.Router();

notificationRoute.get("/", verifyToken, getNotifications);
notificationRoute.patch("/mark-as-read", verifyToken, markNotificationsAsRead);
