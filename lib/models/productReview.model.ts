import mongoose, { Schema } from "mongoose";
import "./user.model";
import "./product.model";

const productReviewSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Index for common queries
productReviewSchema.index({ productId: 1 });
productReviewSchema.index({ userId: 1 });
productReviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); // One review per user per product

const ProductReviews =
  mongoose.models.ProductReviews ||
  mongoose.model("ProductReviews", productReviewSchema);

export default ProductReviews;
