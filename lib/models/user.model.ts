import mongoose from "mongoose";

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
  addresses: { type: [deliveryAddressSchema], required: false },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiry: Date,
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
