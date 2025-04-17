import mongoose, { Schema } from "mongoose";

const parentCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
});

const ParentCategory =
  mongoose.models.ParentCategory ||
  mongoose.model("ParentCategory", parentCategorySchema);

export default ParentCategory;
