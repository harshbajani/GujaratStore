import mongoose from "mongoose";

const storeAddressSchema = new mongoose.Schema({
  address_line_1: { type: String, required: true },
  address_line_2: { type: String, required: true },
  locality: { type: String, required: true },
  pincode: { type: String, required: true, minlength: 6 },
  state: { type: String, required: true },
  landmark: { type: String, optional: true },
});

const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  bankCode: { type: String, required: true },
  ifscCode: { type: String, required: true, minlength: 11 },
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountType: { type: String, enum: ["savings", "current"], required: true },
});

const store = new mongoose.Schema({
  storeName: { type: String, required: true, minlength: 2 },
  contact: { type: String, required: true, minlength: 10 },
  addresses: { type: storeAddressSchema, required: true },
  alternativeContact: { type: String, optional: true },
});

const identitySchema = new mongoose.Schema({
  aadharCardNumber: { type: String, required: true },
  aadharCardDoc: { type: String, required: true },
  panCard: { type: String, required: true },
  panCardDoc: { type: String, required: true },
});

const businessSchema = new mongoose.Schema({
  MSMECertificate: { type: String, optional: true },
  UdhyamAadhar: { type: String, optional: true },
  Fassai: { type: String, optional: true },
  CorporationCertificate: { type: String, optional: true },
  OtherDocuments: { type: String, optional: true },
});

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["vendor"], default: "vendor" },
  store: { type: store, required: true },
  bankDetails: { type: bankDetailsSchema, required: true },
  vendorIdentity: { type: identitySchema, required: false },
  businessIdentity: { type: businessSchema, required: false },
  isVerified: { type: Boolean, default: false }, // Business approval by admin
  emailVerified: { type: Boolean, default: false }, // Email verification via OTP
  verificationToken: String,
  verificationTokenExpiry: Date,
});

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export default Vendor;
