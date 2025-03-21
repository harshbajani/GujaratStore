import mongoose from "mongoose";

const usedDiscountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  discountCode: {
    type: String,
    required: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to ensure unique usage per user and discount
usedDiscountSchema.index({ userId: 1, discountCode: 1 }, { unique: true });

const UsedDiscount =
  mongoose.models.UsedDiscount ||
  mongoose.model("UsedDiscount", usedDiscountSchema);

export default UsedDiscount;
