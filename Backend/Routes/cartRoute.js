import express from "express";
import {
  getCart,
  addOrUpdateCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCart,
} from "../Controllers/cartController.js";
import { verifyToken } from "../utils/commonFunctions.js";

export const cartRoute = express.Router();

// 🔍 Middleware Security Validation Log
cartRoute.use((req, res, next) => {
  // console.log(`[Cart Route Triggered]: ${req.method} ${req.url}`);
  next();
});

// All cart operations require authentication
cartRoute.get("/", verifyToken, getCart);
cartRoute.post("/", verifyToken, addOrUpdateCartItem);
cartRoute.put("/:productId", verifyToken, updateCartItem);
cartRoute.delete("/:productId", verifyToken, removeCartItem);
cartRoute.delete("/", verifyToken, clearCart);
cartRoute.post("/sync", verifyToken, syncCart);
