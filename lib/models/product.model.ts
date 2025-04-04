import mongoose, { Schema } from "mongoose";
import "@/lib/models/parentCategory.model";
import "@/lib/models/primaryCategory.model";
import "@/lib/models/secondaryCategory.model";
import "@/lib/models/brand.model";
import "@/lib/models/attribute.model";
import "@/lib/models/size.model";
import "@/lib/models/productReview.model";
import "@/lib/models/vendor.model";

const productSchema = new Schema({
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
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
  productSize: [
    {
      type: Schema.Types.ObjectId,
      ref: "Size",
    },
  ],
  productSKU: { type: String, required: true },
  productColor: { type: String, required: false },
  productDescription: { type: String, required: true },
  productImages: { type: [String], required: true },
  productCoverImage: { type: String, required: true },
  mrp: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  discountType: {
    type: String,
    enum: ["percentage", "amount"],
    required: true,
  },
  discountValue: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  netPrice: { type: Number, required: true },
  deliveryCharges: { type: Number, required: true },
  deliveryDays: { type: Number, required: true },
  productStatus: { type: Boolean, default: true },
  productQuantity: { type: Number, required: true },
  gender: {
    type: String,
    enum: ["male", "female", "unisex", "not-applicable"],
    required: false,
    default: "male",
  },
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

// Add indexes for frequently queried fields
productSchema.index({ productName: 1 });
productSchema.index({ productSKU: 1 });
productSchema.index({ productStatus: 1 });
productSchema.index({ parentCategory: 1 });
productSchema.index({ primaryCategory: 1 });
productSchema.index({ secondaryCategory: 1 });
productSchema.index({ brands: 1 });
productSchema.index({ netPrice: 1 });
productSchema.index({ productRating: 1 });

// Add compound indexes for common query combinations
productSchema.index({ parentCategory: 1, productStatus: 1 });
productSchema.index({ primaryCategory: 1, productStatus: 1 });
productSchema.index({ secondaryCategory: 1, productStatus: 1 });
productSchema.index({ brands: 1, productStatus: 1 });
productSchema.index({ productSize: 1, productStatus: 1 });

const Products =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Products;
