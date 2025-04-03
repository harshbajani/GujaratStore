import mongoose, { Schema } from "mongoose";

const secondaryCategorySchema = new Schema({
  name: { type: String, required: true },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: "ParentCategory",
    required: true,
  },
  primaryCategory: {
    type: Schema.Types.ObjectId,
    ref: "PrimaryCategory",
    required: true,
  },
  attributes: {
    type: [Schema.Types.ObjectId],
    ref: "Attributes",
    required: true,
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
});

const SecondaryCategory =
  mongoose.models.SecondaryCategory ||
  mongoose.model("SecondaryCategory", secondaryCategorySchema);

export default SecondaryCategory;
