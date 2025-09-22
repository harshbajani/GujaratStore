import mongoose, { Schema } from "mongoose";

const primaryCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: "ParentCategory", // Reference to ParentCategory
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  description: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaKeywords: { type: [String], default: [] },
  metaDescription: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
});

const PrimaryCategory =
  mongoose.models.PrimaryCategory ||
  mongoose.model("PrimaryCategory", primaryCategorySchema);

export default PrimaryCategory;
