import mongoose from "mongoose";
import "./product.model";
import "./order.model";

const deliveryAddressSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  contact: { type: String, required: true, minlength: 10 },
  type: { type: String },
  address_line_1: { type: String, required: true },
  address_line_2: { type: String, required: true },
  locality: { type: String, required: true },
  pincode: { type: String, required: true, minlength: 6 },
  state: { type: String, required: true },
  landmark: { type: String, optional: true },
  alternativeContact: { type: String, optional: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user"], default: "user" },
  addresses: { type: [deliveryAddressSchema], required: false },
  referral: { type: String },
  referralUsed: {
    type: Boolean,
    default: false,
  },
  wishlist: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Product",
    default: [],
  },
  cart: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Product",
    default: [],
  },
  order: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiry: Date,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
