import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { connectDB } from "./utils/commonFunctions.js";
import { authRoute } from "./Routes/authRoute.js";
import { productRouter } from "./Routes/productRoute.js";
import { categoryRoute } from "./Routes/categoryRoute.js";
import { orderRoute } from "./Routes/orderRoute.js";
import { cartRoute } from "./Routes/cartRoute.js";
import { notificationRoute } from "./Routes/notificationRoute.js";
import { pushNotificationRoute } from "./Routes/pushNotificationRoute.js";
import { analyticsRoute } from "./Routes/analyticsRoute.js";
import { adminRoute } from "./Routes/adminRoute.js";
import { migrateRoles } from "./scripts/migrateRoles.js";
// import { initWhatsAppClient } from "./utils/whatsapp.js";

dotenv.config();

/*
===========================================================
GLOBAL ERROR HANDLERS
===========================================================
*/

process.on("unhandledRejection", (reason) => {
  console.error("[CRITICAL] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] Uncaught Exception:", err);
});

/*
===========================================================
EXPRESS APP
===========================================================
*/

const app = express();

/*
===========================================================
MIDDLEWARES
===========================================================
*/

app.use(cookieParser());

app.use(
  express.json({
    limit: "50mb",
  }),
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

app.use(helmet());

app.set("trust proxy", 1);

/*
===========================================================
INITIALIZE DATABASE (ONLY ONCE)
===========================================================
*/

let initialized = false;

async function initializeServer() {
  if (initialized) return;

  try {
    console.log("Initializing Backend...");

    await connectDB();

    await migrateRoles();

    /*
    Enable only if Railway / VPS
    */

    // if (process.env.ENABLE_WHATSAPP === "true") {
    //     await initWhatsAppClient();
    // }

    initialized = true;

    console.log("Backend Ready");
  } catch (error) {
    console.error("Initialization Failed:", error);
    throw error;
  }
}

/*
===========================================================
RUN INITIALIZATION BEFORE EVERY REQUEST
(Only first request actually initializes)
===========================================================
*/

app.use(async (req, res, next) => {
  try {
    await initializeServer();
    next();
  } catch (err) {
    next(err);
  }
});

/*
===========================================================
ROUTES
===========================================================
*/

app.use("/api/v1/auth", authRoute);

app.use("/api/v1/product", productRouter);

app.use("/api/v1/category", categoryRoute);

app.use("/api/v1/order", orderRoute);

app.use("/api/v1/cart", cartRoute);

app.use("/api/v1/notifications", notificationRoute);

app.use("/api/v1/push", pushNotificationRoute);

app.use("/api/v1/analytics", analyticsRoute);

app.use("/api/v1/admin", adminRoute);

/*
===========================================================
HEALTH CHECK
===========================================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running successfully 🚀",
  });
});

/*
===========================================================
ERROR HANDLER
===========================================================
*/

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    status: err.status || 500,
    message: err.message || "Something went wrong",
    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : undefined,
  });
});

export default app;