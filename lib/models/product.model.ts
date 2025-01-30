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
  secondaryCategory: {
    type: Schema.Types.ObjectId,
    ref: "SecondaryCategory",
    required: true,
  },
  attributes: [
    {
      attributeId: {
        type: Schema.Types.ObjectId,
        ref: "Attributes",
        required: true,
      },
      value: { type: String, required: true },
    },
  ],
  brands: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  productSKU: { type: String, required: true },
  productColor: { type: String, required: true },
  productDescription: { type: String, required: true },
  productImages: { type: [String], required: true },
  productCoverImage: { type: String, required: true },
  mrp: { type: Number, required: true }, // Maximum Retail Price
  basePrice: { type: Number, required: true }, // Base Price
  discountType: {
    type: String,
    enum: ["percentage", "amount"],
    required: true,
  }, // Discount Type
  discountValue: { type: Number, required: true }, // Discount Value
  gstRate: { type: Number, required: true }, // GST Rate
  gstAmount: { type: Number, required: true }, // GST Amount
  netPrice: { type: Number, required: true },
  productStatus: { type: Boolean, default: true },
  productRating: { type: Number, required: false },
  productReviews: [
    { type: Schema.Types.ObjectId, ref: "ProductReviews", required: false },
  ],
  productWarranty: { type: String, required: false },
  productReturnPolicy: { type: String, required: false },
  metaTitle: { type: String, default: "" },
  metaKeywords: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
});

const Products =
  mongoose.models.ProductSchema ||
  mongoose.model("ProductSchema", productSchema);

export default Products;
