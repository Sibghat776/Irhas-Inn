import express from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} from "../Controllers/orderController.js";
import { verifyToken, verifyAdmin } from "../utils/commonFunctions.js";

export const orderRoute = express.Router();

orderRoute.post("/createOrder", verifyToken, createOrder);
orderRoute.get("/myOrders", verifyToken, getMyOrders);
orderRoute.get("/getOrder/:id", verifyToken, getOrderById);
orderRoute.get("/getAllOrders", verifyAdmin, getAllOrders);
orderRoute.put("/updateOrder/:id", verifyAdmin, updateOrder);
orderRoute.patch("/:orderId/status", verifyToken, verifyAdmin, updateOrderStatus);
orderRoute.delete("/deleteOrder/:id", verifyAdmin, deleteOrder);
