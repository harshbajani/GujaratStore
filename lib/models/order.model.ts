import mongoose, { Schema } from "mongoose";
import "./product.model";
import "./user.model";

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  deliveryDate: {
    type: String, // Consider using Date if you convert the format accordingly
    required: true,
  },
  selectedSize: {
    type: String,
    required: false,
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
});

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true, // Ensures no two orders share the same custom orderId
    },
    status: {
      type: String,
      enum: [
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "confirmed",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryCharges: {
      type: Number,
      required: true,
    },
    discountAmount: { type: Number, default: 0 },
    discountCode: { type: String },
    total: {
      type: Number,
      required: true,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    paymentOption: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
