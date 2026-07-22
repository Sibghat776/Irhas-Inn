import Users from "../Models/Users.js";
import { createError, createSuccess, resolveRole } from "../utils/commonFunctions.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOTP, sendEmail } from "../utils/sendEmail.js"; // OTP generator + centralized email sender
import { OAuth2Client } from "google-auth-library";
import twilio from "twilio";
import dotenv from "dotenv";
// import { sendWhatsAppOTP } from "../utils/whatsapp.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { sendPushToAdmins } from "./pushNotificationController.js";
dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
  : [];
const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
// Both superadmin and reseller admins get isAdmin=true for backward compat
const isAdminEmail = (email) => {
  const e = (email || "").trim().toLowerCase();
  return e === superAdminEmail || adminEmails.includes(e);
};
const getRoleFromEmail = (email) => {
  const e = (email || "").trim().toLowerCase();
  if (e === superAdminEmail) return "superadmin";
  if (adminEmails.includes(e)) return "admin";
  return "user";
};

// Reusable OTP email body builder — keeps the nice formatting in one place
// Plain text version (fallback for email clients that don't render HTML)
const buildOtpEmailText = (otp) =>
  `Hello,\n\nYour verification code for ZeeF Trendy Store is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, you can safely ignore this email.\n\nNeed help? Contact us at ${process.env.EMAIL}\n\nZeeF Trendy Store`;

// HTML themed version
const buildOtpEmailHtml = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ZeeF Trendy Store Verification</title>
<style>
  @media only screen and (max-width: 520px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .inner-padding { padding: 28px 20px !important; }
    .otp-box { padding: 14px 20px !important; }
    .otp-code { font-size: 26px !important; letter-spacing: 4px !important; }
    .header-pad { padding: 22px 20px !important; }
    .footer-pad { padding: 18px 20px 24px 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f0f0f2; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f2; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="480" cellpadding="0" cellspacing="0" style="width:480px; max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header with colorful gradient -->
          <tr>
            <td class="header-pad" style="background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 50%, #d4af37 100%); padding: 32px 32px;" align="center">
              <span style="color:#ffffff; font-size:24px; font-weight:bold; letter-spacing:1.5px; font-family: Arial, Helvetica, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">ZeeF Trendy Store</span>
            </td>
          </tr>

          <!-- Colorful accent line -->
          <tr>
            <td style="height:5px; background: linear-gradient(90deg, #f107a3, #d4af37, #00b8a9, #7b2ff7);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="inner-padding" style="padding: 40px 36px 28px 36px;">
              <p style="margin:0 0 4px 0; color:#111111; font-size:17px; font-weight:600;">Verify your identity</p>
              <p style="margin:0 0 28px 0; color:#666666; font-size:14.5px; line-height:1.7;">
                Use the code below to complete your request. This code is valid for the next <strong style="color:#333;">10 minutes</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 4px 0 32px 0;">
                    <div class="otp-box" style="display:inline-block; background: linear-gradient(135deg, #fdf3fb 0%, #fdf6e3 100%); border: 1.5px solid #d4af37; border-radius:10px; padding: 18px 42px;">
                      <span class="otp-code" style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#7b2ff7; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border-radius:8px; border-left: 4px solid #00b8a9;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 6px 0; color:#888888; font-size:13px; line-height:1.6;">
                      For your security, never share this code with anyone. ZeeF Trendy Store staff will never ask for it.
                    </p>
                    <p style="margin:0; color:#999999; font-size:13px; line-height:1.6;">
                      Didn't request this? You can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 36px;">
              <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="padding: 22px 36px 30px 36px;" align="center">
              <p style="margin:0 0 6px 0; color:#999999; font-size:12.5px;">Need help? Contact us at <a href="mailto:${process.env.EMAIL}" style="color:#f107a3; text-decoration:none; font-weight:600;">${process.env.EMAIL}</a></p>
              <p style="margin:0 0 6px 0; color:#c2c2c2; font-size:11.5px;">Karachi, Pakistan</p>
              <p style="margin:0; color:#c2c2c2; font-size:12px;">© ${new Date().getFullYear()} ZeeF Trendy Store. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ==========================================
// 1. REGISTER (With WhatsApp Phone Verification)
// ==========================================
export const register = async (req, res, next) => {
  try {
    if (!req.body) return next(createError(400, "All fields are required!"));

    const { username, email, phoneNo, password } = req.body;

    // Validation
    if (!username || !email || !phoneNo || !password) {
      return next(createError(400, "All Fields are required!"));
    }

    // Check if email OR Phone Number already exists
    const isExist = await Users.findOne({
      $or: [{ email: email }, { phoneNo: phoneNo }],
    });
    if (isExist)
      return next(createError(550, "Email, or Phone Number already exist!"));

    if (password.length < 6) {
      return next(
        createError(400, "Password should contain minimum 6 letters!"),
      );
    }
    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Generate OTP
    const otp = generateOTP();
    if (!otp) return next(createError(500, "Failed to generate OTP!"));

    // Create new user
    const newUser = new Users({
      username,
      email,
      phoneNo,
      password: hash,
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      isAdmin: isAdminEmail(email),
    });
    await newUser.save();

    // const whatsappSent = await sendWhatsAppOTP(phoneNo, otp);
    const { password: _, otpExpires, otp: __, ...userDetails } = newUser._doc;

    let emailSent = false;
    try {
      await sendEmail(
        email,
        "OTP for Email Verification",
        buildOtpEmailText(otp),
        buildOtpEmailHtml(otp),
      );
      emailSent = true;
      console.log("Email sent to", email);
    } catch (error) {
      console.error("Email Error:", error.message || error);
    }

    const otpSent = emailSent || whatsappSent;

    if (!otpSent) {
      await Users.findByIdAndDelete(newUser._id);
      return next(createError(500, "Failed to send OTP. Please try again."));
    }

    const data = createSuccess(
      201,
      whatsappSent
        ? "Verification OTP sent to your WhatsApp and Email"
        : "Verification OTP sent to your Email (WhatsApp unavailable)",
      { ...userDetails, otpSent },
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. VERIFY OTP (By Email)
// ==========================================
export const verifyOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;

    console.log(identifier);

    if (!identifier || !otp) {
      return next(createError(400, "Identifier and OTP are required!"));
    }

    const user = await Users.findOne({
      $or: [{ email: identifier }, { phoneNo: identifier }],
    });

    if (!user) {
      return next(createError(404, "User not found!"));
    }

    if (!user.otp || !user.otpExpires) {
      return next(createError(400, "OTP not requested or expired"));
    }

    if (Date.now() > new Date(user.otpExpires).getTime()) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return next(createError(400, "OTP has expired"));
    }
    if (String(user.otp) !== String(otp)) {
      return next(createError(400, "Invalid OTP"));
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.isAdmin = isAdminEmail(user.email);
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        role: resolveRole(user.email, user.role),
      },
      process.env.JWT,
      {
        expiresIn: "3d",
      },
    );

    const { password, ...userDetails } = user._doc;
    const responseUser = { ...userDetails, role: resolveRole(user.email, user.role) };
    return res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(createSuccess(200, "Account Verified Successfully!", responseUser));
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return next(createError(400, "Email or Phone Number is required!"));
    }
    const user = await Users.findOne({
      $or: [{ email: identifier }, { phoneNo: identifier }],
    });
    if (!user) return next(createError(404, "User not found!"));

    const otp = generateOTP();
    if (!otp) return next(createError(500, "Failed to generate OTP!"));
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    console.log(identifier, "OTP", otp);
    await user.save();
    // const isSent = await sendWhatsAppOTP(user.phoneNo, otp);
    if (!isSent) {
      console.warn("WhatsApp OTP failed on resend, falling back to email.");
    }

    if (identifier.includes("@")) {
      try {
        await sendEmail(
          identifier,
          "OTP for Email Verification",
          buildOtpEmailText(otp),
          buildOtpEmailHtml(otp),
        );
        console.log("Email sent to", identifier);
      } catch (error) {
        console.error("Email Error:", error.message || error);
      }
    } else {
      // await sendWhatsAppOTP(user.phoneNo, otp);
    }

    res
      .status(200)
      .json(createSuccess(200, "OTP resent to your Whatsapp and Email!"));
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. LOGIN (Supports Email OR Phone Login)
// ==========================================
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // 'identifier' can be email OR phoneNo

    if (!identifier || !password) {
      return next(createError(400, "Email/Phone and Password are required!"));
    }

    // Find user by either email or phone number
    const user = await Users.findOne({
      $or: [{ email: identifier }, { phoneNo: identifier }],
    });
    if (!user) return next(createError(404, "User not found! from backend"));

    if (user.googleId) {
      return next(createError(400, "Please Login with Google"));
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return next(createError(400, "Wrong Credentials!"));

    if (isPasswordCorrect && !user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      let emailSent = false;
      let whatsappSent = false;

      if (identifier.includes("@")) {
        try {
          await sendEmail(
            identifier,
            "OTP for Email Verification",
            buildOtpEmailText(otp),
            buildOtpEmailHtml(otp),
          );
          emailSent = true;
          console.log("Email sent to", identifier);
        } catch (error) {
          console.error("Email Error:", error.message || error);
        }
      } else {
        // whatsappSent = await sendWhatsAppOTP(user.phoneNo, otp);
      }

      const otpSent = identifier.includes("@") ? emailSent : whatsappSent;

      return res.status(200).json({
        success: false,
        requiresVerification: true,
        otpSent,
        identifier: identifier,
        message: otpSent
          ? "OTP sent successfully!"
          : "Failed to send OTP. Please try again.",
      });
    }
    const { password: _, otp, otpExpires, ...userDetails } = user._doc;

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin, role: resolveRole(user.email, user.role) },
      process.env.JWT,
      { expiresIn: "3d" },
    );

    const loginResponseUser = { ...userDetails, role: resolveRole(user.email, user.role) };
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(createSuccess(200, "User Logged In Successfully", loginResponseUser));
  } catch (error) {
    next(error);
  }
};
// ==========================================
// 4. GOOGLE AUTH LOGIN / REGISTER
// ==========================================
export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return next(createError(400, "Google credential is required!"));
    }

    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // Find User
    let user = await Users.findOne({ email });

    // .env se emails fetch karein
    const shouldBeAdmin = isAdminEmail(email);

    // If user does not exist (New Sign up)
    if (!user) {
      user = new Users({
        username: name.replace(/\s+/g, ""),
        email,
        profilePic: picture,
        googleId: sub,
        isVerified: true,
        isAdmin: shouldBeAdmin, // Yahan set ho jayega
      });
      await user.save();
    } else {
      // Agar existing user hai lekin .env mein admin add hua hai, toh update karein
      if (!user.isAdmin && shouldBeAdmin) {
        user.isAdmin = true;
        await user.save();
      }
    }

    // JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        role: resolveRole(user.email, user.role),
      },
      process.env.JWT,
      {
        expiresIn: "3d",
      },
    );

    const { password, otp, otpExpires, ...userDetails } = user._doc;
    const googleResponseUser = { ...userDetails, role: resolveRole(user.email, user.role) };

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(createSuccess(200, "Google Login Successful!", googleResponseUser));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await Users.findOne({ username });
    if (!user) return next(createError(404, "User not found!"));

    const { password, otp, otpExpires, ...userDetails } = user._doc;
    const userWithRole = { ...userDetails, role: resolveRole(user.email, user.role) };
    res
      .status(200)
      .json(createSuccess(200, "User fetched successfully!", userWithRole));
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await Users.find()
      .select("-password -otp -otpExpires")
      .populate({
        path: "cart.product",
        select: "name price stock description images slug brand category",
      });

    res
      .status(200)
      .json(createSuccess(200, "Users fetched successfully!", users));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await Users.findOne({ _id: req.params.id });
    if (!user) return next(createError(404, "User not found!"));

    const { username, email, phoneNo, password, address } = req.body;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNo) user.phoneNo = phoneNo;
    if (address) user.address = address;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "zeef/products");
      user.profilePic = result.secure_url;
    }

    await user.save();

    const { password: _, otp, otpExpires, ...userDetails } = user._doc;
    res
      .status(200)
      .json(createSuccess(200, "User updated successfully!", userDetails));
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", { path: "/" });
    res.status(200).json(createSuccess(200, "User logged out successfully!"));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await Users.findByIdAndDelete(req.params.id);
    res.status(200).json(createSuccess(200, "User deleted successfully!"));
  } catch (error) {
    next(error);
  }
};

export const contactUs = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return next(
        createError(400, "All fields (name, email, message) are required"),
      );
    }

    console.log(`[Contact] Message from ${name} (${email}): ${message}`);

    await sendEmail(
      process.env.EMAIL,
      `Contact Form: Message from ${name}`,
      `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    );

    // Web Push to admins' subscribed devices so they get a phone notification
    try {
      const result = await sendPushToAdmins({
        title: "New Contact Message 📩",
        body: `${name} (${email}): ${message.slice(0, 80)}${message.length > 80 ? "…" : ""}`,
        link: "/Admin",
      });
      console.log(`[Push Sent to Admins]: sent ${result.sent}, removed ${result.removed}`);
    } catch (pushErr) {
      console.error("[Push Failed to Admins]:", pushErr.message);
    }

    res.status(200).json(createSuccess(200, "Message sent successfully!"));
  } catch (error) {
    next(error);
  }
};
