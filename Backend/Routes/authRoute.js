import e from "express";
import { createLimiter, verifyAdmin } from "../utils/commonFunctions.js";
import {
  contactUs,
  deleteUser,
  getUser,
  getUsers,
  googleAuth,
  login,
  logout,
  register,
  resendOtp,
  updateUser,
  verifyOtp,
} from "../Controllers/authController.js";
import upload from "../middlewares/upload.js";
import { verifyUser } from "../utils/commonFunctions.js";

export let authRoute = e.Router();

authRoute.post("/register", upload.single("profilePic"), register);
authRoute.post("/google", createLimiter(10, 5), googleAuth);
authRoute.post("/verifyOtp", createLimiter(10), verifyOtp);
authRoute.post("/resendOtp", createLimiter(10), resendOtp);
authRoute.post("/login", createLimiter(10), login);
authRoute.put(
  "/updateUser/:id",
  verifyUser,
  upload.single("profilePic"),
  updateUser,
);
authRoute.get("/logout", logout);
authRoute.delete("/deleteUser/:id", verifyAdmin, deleteUser);
authRoute.get("/getUser/:username", getUser);
authRoute.get("/getUsers", verifyAdmin, createLimiter(10), getUsers);
authRoute.post("/contact", contactUs);
