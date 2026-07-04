import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
dotenv.config();
import jwt from "jsonwebtoken";

export const createError = (status, message) => {
  const err = new Error();
  err.status = status;
  err.message = message;
  return err;
};
export const createSuccess = (status, message, data = {}) => {
  const successObj = {};
  successObj.status = status;
  successObj.message = message;
  successObj.data = data;
  return successObj;
};
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) return next(createError(401, "You are not authenticated!"));

    jwt.verify(token, process.env.JWT, (err, user) => {
      if (err) return next(createError(403, "Token is not valid!"));

      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      next(createError(401, "You are not authorized"));
    }
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.isAdmin) {
      next();
    } else {
      next(createError(401, "You are not authorized"));
    }
  });
};

export const connectDB = async () => {
  const cached = global.mongoose || {};
  if (!global.mongoose) global.mongoose = cached;
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGO = process.env.MONGO;
    if (!MONGO) throw createError(500, "MongoDB URI not found in env");

    mongoose.set("strictQuery", false);

    cached.promise = mongoose
      .connect(MONGO, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        mongoose.connection.on("disconnected", () => {
          console.warn("⚠️ MongoDB disconnected, attempting to reconnect...");
        });
        mongoose.connection.on("reconnected", () => {
          console.log("✅ MongoDB reconnected");
        });
        mongoose.connection.on("error", (err) => {
          console.error("MongoDB connection error:", err.message);
        });
        console.log("✅ New DB Connected");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("MongoDB initial connection error:", err.message);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

export const createLimiter = (maxRequests, timeInMinutes = 5) => {
  return rateLimit({
    windowMs: timeInMinutes * 60 * 1000,
    max: maxRequests, // Yeh aapke diye gaye 'maxRequests' ke hisaab se chalega
    message: {
      status: 429,
      error: `Limit exceeded. Max ${maxRequests} requests allowed per ${timeInMinutes} minutes.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and") // & → and
    .replace(/[^a-z0-9\s-]/g, "") // special characters remove
    .replace(/\s+/g, "-") // spaces → dash
    .replace(/-+/g, "-"); // multiple dashes → single dash
};
