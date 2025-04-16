import mongoose, { Schema } from "mongoose";
import "./vendor.model";

const attributeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
});

const Attributes =
  mongoose.models.Attributes || mongoose.model("Attributes", attributeSchema);

export default Attributes;
