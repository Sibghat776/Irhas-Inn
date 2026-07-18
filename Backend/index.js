import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/commonFunctions.js";
import helmet from "helmet";
import { authRoute } from "./Routes/authRoute.js";
import { initWhatsAppClient } from "./utils/whatsapp.js";
import { productRouter } from "./Routes/productRoute.js";
import { categoryRoute } from "./Routes/categoryRoute.js";
import { orderRoute } from "./Routes/orderRoute.js";
import { cartRoute } from "./Routes/cartRoute.js";
import { notificationRoute } from "./Routes/notificationRoute.js";
import { pushNotificationRoute } from "./Routes/pushNotificationRoute.js";
import { analyticsRoute } from "./Routes/analyticsRoute.js";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json({ limit: "50mb" })); // Badi requests ke liye limit badha di
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS configuration (Apne Frontend URL se '*' replace kar dein)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

app.use(helmet());
console.log("BACKEND PUBLIC :", process.env.VAPID_PUBLIC_KEY);
console.log("BACKEND PRIVATE:", process.env.VAPID_PRIVATE_KEY);
// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/notifications", notificationRoute);
app.use("/api/v1/push", pushNotificationRoute);
app.use("/api/v1/analytics", analyticsRoute);

// Server Start and DB Connection (No if condition)
(async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      // Initialize WhatsApp client only if explicitly enabled via .env
      if (process.env.ENABLE_WHATSAPP === 'true') {
        initWhatsAppClient(); // WhatsApp Client ko server start hone ke baad initialize karein
      }
    });
    app.set("trust proxy", 1);
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
})();

// Error Handler (Always last)
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went Wrong";
  res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});
export default app;
