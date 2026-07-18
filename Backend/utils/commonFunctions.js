import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
dotenv.config();
import jwt from "jsonwebtoken";
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
// ==================== ROLE RESOLVER ====================
export const resolveRole = (email) => {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (normalizedEmail === superAdminEmail) return "superadmin";
  if (adminEmails.includes(normalizedEmail)) return "admin";
  return "user";
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

    jwt.verify(token, process.env.JWT, async (err, user) => {
      if (err) return next(createError(403, "Token is not valid!"));
      req.user = user;
      try {
        const Users = (await import("../Models/Users.js")).default;
        const dbUser = await Users.findById(user.id).select("email").lean();
        if (dbUser) {
          req.user.email = dbUser.email;
          req.user.role = resolveRole(dbUser.email);
        } else {
          req.user.role = "user";
        }
      } catch {
        req.user.role = "user";
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.id === req.params.id || req.user.isAdmin || req.user.role === "superadmin" || req.user.role === "admin") {
      next();
    } else {
      next(createError(401, "You are not authorized"));
    }
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role === "superadmin" || req.user.role === "admin" || req.user.isAdmin) {
      next();
    } else {
      next(createError(401, "You are not authorized"));
    }
  });
};

export const requireSuperAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role === "superadmin") {
      next();
    } else {
      next(createError(403, "Super admin access required"));
    }
  });
};

export const requireAdminOrAbove = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role === "superadmin" || req.user.role === "admin") {
      next();
    } else {
      next(createError(403, "Admin access required"));
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
