import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: {
    type: String,
    enum: ["verification", "password-reset"],
    default: "verification",
  },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);
export default OTP;
