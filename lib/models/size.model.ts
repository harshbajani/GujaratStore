import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISize extends Document {
  label: string;
  vendorId: Schema.Types.ObjectId;
  value: string;
  isActive: boolean;
}

const sizeSchema: Schema<ISize> = new Schema(
  {
    label: { type: String, required: true, unique: true },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    value: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Size: Model<ISize> =
  mongoose.models.Size || mongoose.model<ISize>("Size", sizeSchema);
export default Size;
