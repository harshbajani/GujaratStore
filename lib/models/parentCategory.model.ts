import mongoose, { Schema } from "mongoose";

const parentCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  isActive: { type: Boolean, default: true },
});

const ParentCategory =
  mongoose.models.ParentCategory ||
  mongoose.model("ParentCategory", parentCategorySchema);

export default ParentCategory;
