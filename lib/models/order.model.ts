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
        "unconfirmed", // For payment pending orders
        "processing", // Default status after successful order/payment
        "ready to ship", // When order is picked and ready
        "shipped", // When order has been picked up by courier
        "out for delivery", // When order is out for delivery
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "processing",
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
    rewardDiscountAmount: { type: Number, default: 0 },
    pointsRedeemed: { type: Number, default: 0 },
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
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentInfo: {
      razorpay_payment_id: { type: String },
      razorpay_order_id: { type: String },
      payment_status: { type: String },
      payment_method: { type: String },
      payment_amount: { type: Number },
      verified_at: { type: String },
    },
    refundInfo: {
      refund_id: { type: String }, // Razorpay refund ID
      refund_amount: { type: Number }, // Amount refunded in paise
      refund_status: { 
        type: String, 
        enum: ['pending', 'processed', 'failed'],
        default: null 
      },
      refund_initiated_at: { type: Date },
      refund_processed_at: { type: Date },
      refund_reason: { type: String },
      refund_receipt: { type: String }, // Unique receipt for refund
    },
    // Shiprocket Integration Fields
    shipping: {
      shiprocket_order_id: { type: Number },
      shiprocket_shipment_id: { type: Number },
      awb_code: { type: String }, // Air Waybill Number from courier
      courier_name: { type: String },
      tracking_url: { type: String },
      shipping_status: { type: String }, // The raw status from Shiprocket
      eta: { type: Date }, // Estimated time of arrival
      pickup_date: { type: Date },
      delivered_date: { type: Date },
      last_update: { type: Date },
      shipping_history: [{
        status: { type: String },
        activity: { type: String },
        location: { type: String },
        date: { type: Date },
      }],
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
