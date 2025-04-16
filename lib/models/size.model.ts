import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISize extends Document {
  label: string;
  value: string;
  isActive: boolean;
}

const sizeSchema: Schema<ISize> = new Schema(
  {
    label: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Size: Model<ISize> =
  mongoose.models.Size || mongoose.model<ISize>("Size", sizeSchema);
export default Size;
