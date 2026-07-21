import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        selectedColor: {
          type: String,
          trim: true,
          default: "",
        },
        selectedSize: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNo: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        default: "Karachi",
      },
      country: {
        type: String,
        default: "Pakistan",
      },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "Cash on Delivery",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Pending",
    },
    trackingHistory: [
      {
        status: {
          type: String,
          enum: ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Order = mongoose.model("Order", orderSchema);
