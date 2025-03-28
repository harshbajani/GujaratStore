import mongoose from "mongoose";
import "./user.model";

const usedDiscountSchema = new mongoose.Schema({
  userIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    required: true,
    default: [],
  },
  discountCode: {
    type: String,
    required: true,
    index: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
  maxUses: {
    type: Number,
    default: 1, // Limit to one use per user
  },
});

// Compound index to ensure unique usage per user and discount
usedDiscountSchema.index({ discountCode: 1, userIds: 1 }, { unique: true });

const UsedDiscount =
  mongoose.models.UsedDiscount ||
  mongoose.model("UsedDiscount", usedDiscountSchema);

export default UsedDiscount;
