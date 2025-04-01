import mongoose, { Schema } from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    id: { type: String },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    imageId: { type: String, required: true },
    user: { type: String, required: true },
    date: { type: String, required: true },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    metaKeywords: { type: String },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);
export default Blog;
