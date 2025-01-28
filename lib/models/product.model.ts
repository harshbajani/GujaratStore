import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
  productName: { type: String, required: true },
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
  SecondaryCategory: {
    type: Schema.Types.ObjectId,
    ref: "SecondaryCategory",
    required: true,
  },
  Attributes: {
    type: [Schema.Types.ObjectId],
    ref: "Attributes",
    required: true,
  },
  productSKU: { type: String, required: true },
  productDescription: { type: String, required: true },
  productImage: { type: [String], required: true },
  productCoverImage: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productQuantity: { type: Number, required: true },
  productStatus: { type: Boolean, required: true },
  productRating: { type: Number, required: true },
  productReviews: [{ type: Schema.Types.ObjectId, ref: "ProductReviews" }],
  productWarranty: { type: String, required: true },
  productReturnPolicy: { type: String, required: true },
  metaTitle: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
});

const Products =
  mongoose.models.ProductSchema ||
  mongoose.model("ProductSchema", productSchema);

export default Products;
