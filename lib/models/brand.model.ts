import mongoose, { Schema } from "mongoose";

const brandSchema = new Schema({
  name: { type: String, required: true },
  imageId: { type: String, required: true },
  metaTitle: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
});

const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema);

export default Brand;
