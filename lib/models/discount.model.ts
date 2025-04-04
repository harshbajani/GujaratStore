import mongoose, { Schema } from "mongoose";
import "@/lib/models/parentCategory.model";

// Define enum for discount types
export enum DiscountType {
  PERCENTAGE = "percentage",
  AMOUNT = "amount",
}

// Define enum for discount target types - simplified to just CATEGORY
export enum DiscountTargetType {
  CATEGORY = "category", // For applying discount on parent category
}

const discountSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  discountType: {
    type: String,
    enum: Object.values(DiscountType),
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  targetType: {
    type: String,
    enum: Object.values(DiscountTargetType),
    default: DiscountTargetType.CATEGORY,
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: "ParentCategory",
    required: true,
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
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

// Add indexes for frequently queried fields
discountSchema.index({ parentCategory: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });

// Compound indexes
discountSchema.index({ parentCategory: 1, isActive: 1 });

const Discount =
  mongoose.models.Discount || mongoose.model("Discount", discountSchema);

export default Discount;
