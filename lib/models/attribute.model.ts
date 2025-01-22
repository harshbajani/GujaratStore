// lib/models/jobPosition.model.ts
import mongoose, { Schema } from "mongoose";

const attributeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
});

const Attributes =
  mongoose.models.Attributes || mongoose.model("Attributes", attributeSchema);

export default Attributes;
