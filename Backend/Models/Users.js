import mongoose from "mongoose";
let { Schema } = mongoose;

let UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNo: {
      type: String,
      default: null,
    },
    orders: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      default: null,
    },
    profilePic: {
      required: false,
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: false,
      default: "",
    },
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
      },
    ],
    otp: {
      type: Number,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);
