import mongoose, { Schema } from "mongoose";

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    imageId: { type: String, required: true },
    metaTitle: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

brandSchema.index({ createdAt: -1 });

const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);

export default Brand;
