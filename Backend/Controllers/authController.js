import Users from "../Models/Users.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOTP } from "../utils/sendEmail.js"; // OTP generator utility
import { OAuth2Client } from "google-auth-library";
import twilio from "twilio";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { sendWhatsAppOTP } from "../utils/whatsapp.js";
import { sendEmail } from "../utils/sendEmail.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",")
  : [];

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
      isAdmin: adminEmails.includes(email),
    });
    await newUser.save();

    const isSent = await sendWhatsAppOTP(phoneNo, otp);
    const { password: _, otpExpires, otp: __, ...userDetails } = newUser._doc;

    // Do NOT delete user if WhatsApp fails - OTP is also sent via email
    if (!isSent) {
      console.warn("WhatsApp OTP failed, but user saved. OTP sent via email.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      family: 4,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: `${process.env.EMAIL}`,
      to: email,
      subject: "OTP for Email Verification",
      text: `Dear Valued Customer,\n\nWelcome to ZF Store! 🛍️\nWe're thrilled to have you on board.\n\nTo complete your registration, please use the One-Time Password (OTP) below:\n\n\n🔐 Your OTP Code: ${otp}\n━━━━━━━━━━━━━━━\n\n⏳ This OTP is valid for 10 minutes only.\n🔒 Do NOT share this code with anyone.\n\nOnce verified, you'll be able to:\n✅ Browse our latest collections\n✅ Place orders with ease\n✅ Track your deliveries in real time\n✅ Enjoy exclusive deals & offers\n\nIf you did not request this, please ignore this email or contact our support team immediately.\n\n📧 Support: ullahsibghat786@gmail.com\n📱 WhatsApp: +92 323 2603877\n\nThank you for choosing ZF Store — where quality meets style. 🌟\n\nWarm Regards,\nZF Store Team 🛍️\nwww.ZFStore.com`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (error) {
      console.error("Email Error:", error);
    }

    const data = createSuccess(
      201,
      isSent ? "Verification OTP Send to your Whatsapp and Email" : "Verification OTP sent to your Email (WhatsApp unavailable)",
      userDetails,
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
    user.isAdmin = adminEmails.includes(user.email);
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT,
      {
        expiresIn: "3d",
      },
    );

    const { password, ...userDetails } = user._doc;

    return res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(createSuccess(200, "Account Verified Successfully!", userDetails));
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
    const isSent = await sendWhatsAppOTP(user.phoneNo, otp);
    if (!isSent) {
      console.warn("WhatsApp OTP failed on resend, falling back to email.");
    }

    if (identifier.includes("@")) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        family: 4,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
      const mailOptions = {
        from: `${process.env.EMAIL}`,
        to: identifier,
        subject: "OTP for Email Verification",
        text: `Dear Valued Customer,\n\nWelcome to ZF Store! 🛍️\nWe're thrilled to have you on board.\n\nTo complete your registration, please use the One-Time Password (OTP) below:\n\n\n🔐 Your OTP Code: ${otp}\n━━━━━━━━━━━━━━━\n\n⏳ This OTP is valid for 10 minutes only.\n🔒 Do NOT share this code with anyone.\n\nOnce verified, you'll be able to:\n✅ Browse our latest collections\n✅ Place orders with ease\n✅ Track your deliveries in real time\n✅ Enjoy exclusive deals & offers\n\nIf you did not request this, please ignore this email or contact our support team immediately.\n\n📧 Support: ${process.env.EMAIL}`,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
      } catch (error) {
        console.error("Email Error:", error);
      }
    } else {
      await sendWhatsAppOTP(user.phoneNo, otp);
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
      if (identifier.includes("@")) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          family: 4,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        const mailOptions = {
          from: `${process.env.EMAIL}`,
          to: identifier,
          subject: "OTP for Email Verification",
          text: `Dear Valued Customer,\n\nWelcome to ZF Store! 🛍️\nWe're thrilled to have you on board.\n\nTo complete your registration, please use the One-Time Password (OTP) below:\n\n\n🔐 Your OTP Code: ${otp}\n━━━━━━━━━━━━━━━\n\n⏳ This OTP is valid for 10 minutes only.\n🔒 Do NOT share this code with anyone.\n\nOnce verified, you'll be able to:\n✅ Browse our latest collections\n✅ Place orders with ease\n✅ Track your deliveries in real time\n✅ Enjoy exclusive deals & offers\n\nIf you did not request this, please ignore this email or contact our support team immediately.\n\n📧 Support: ullahsibghat786@gmail.com\n📱 WhatsApp: +92 323 2603877\n\nThank you for choosing ZF Store — where quality meets style. 🌟\n\nWarm Regards,\nZF Store Team 🛍️\nwww.ZFStore.com`,
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log("Email sent: " + info.response);
        } catch (error) {
          console.error("Email Error:", error);
        }
      } else {
        await sendWhatsAppOTP(user.phoneNo, otp);
      }
      return res.status(200).json({
        success: false,
        requiresVerification: true,
        identifier: identifier,
        message: "Account not verified!",
      });
    }
    const { password: _, otp, otpExpires, ...userDetails } = user._doc;

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT,
      { expiresIn: "3d" },
    );

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(createSuccess(200, "User Logged In Successfully", userDetails));
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
    // Find User
    let user = await Users.findOne({ email });

    // .env se emails fetch karein
    const shouldBeAdmin = adminEmails.includes(email);

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
      },
      process.env.JWT,
      {
        expiresIn: "3d",
      },
    );

    const { password, otp, otpExpires, ...userDetails } = user._doc;

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(createSuccess(200, "Google Login Successful!", userDetails));
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
    res
      .status(200)
      .json(createSuccess(200, "User fetched successfully!", userDetails));
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
      return next(createError(400, "All fields (name, email, message) are required"));
    }

    console.log(`[Contact] Message from ${name} (${email}): ${message}`);

    await sendEmail(
      process.env.EMAIL,
      `Contact Form: Message from ${name}`,
      `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    );

    res.status(200).json(createSuccess(200, "Message sent successfully!"));
  } catch (error) {
    next(error);
  }
};
