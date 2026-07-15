import mongoose, { Schema, model } from 'mongoose';

const socialPostLogSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    postId: { type: String }, // Meta post identifier
    errorMessage: { type: String },
  },
  { timestamps: true },
);

export const SocialPostLog = model('SocialPostLog', socialPostLogSchema);
