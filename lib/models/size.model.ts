import mongoose, { Schema, Model } from "mongoose";

const sizeSchema: Schema<ISize> = new Schema(
  {
    label: { type: String, required: true, trim: true, unique: true },
    value: { type: String, trim: true, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Size: Model<ISize> =
  mongoose.models.Size || mongoose.model<ISize>("Size", sizeSchema);
export default Size;
