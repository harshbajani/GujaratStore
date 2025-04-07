import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import "./parentCategory.model";

// Define enum for discount types
export enum DiscountType {
  PERCENTAGE = "percentage",
  AMOUNT = "amount",
}

const referralSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(8), // Generate a random 8-character code
  },
  discountType: {
    type: String,
    enum: Object.values(DiscountType),
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: "ParentCategory",
    required: true,
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  maxUses: {
    type: Number,
    required: true,
    min: 1,
    default: 100,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove duplicate indexes
referralSchema.index({ parentCategory: 1 });
referralSchema.index({ isActive: 1 });
referralSchema.index({ expiryDate: 1 });

// Compound indexes
referralSchema.index({ parentCategory: 1, isActive: 1 });
referralSchema.index({ code: 1, isActive: 1 });

const Referral =
  mongoose.models.Referral || mongoose.model("Referral", referralSchema);

export default Referral;
