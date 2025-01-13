import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  message: { type: String, required: false },
});

const Inquiry =
  mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
export default Inquiry;
