import { z } from "zod";

export type FormType = "sign-in" | "sign-up";
export const authFormSchema = (formType: FormType) => {
  return z
    .object({
      name:
        formType === "sign-up"
          ? z.string().min(2).max(50)
          : z.string().optional(),
      email: z.string().email(),
      phone:
        formType === "sign-up"
          ? z.string().min(10).max(10)
          : z.string().optional(),
      referral: z.string().optional(),
      password:
        formType === "sign-up"
          ? z
              .string()
              .min(8, "Password must be at least 8 characters")
              .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number"
              )
          : z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword:
        formType === "sign-up" ? z.string().min(6) : z.string().optional(),
    })
    .refine(
      (data) => {
        if (formType === "sign-up") {
          return data.password === data.confirmPassword;
        }
        return true;
      },
      {
        message: "Passwords must match",
        path: ["confirmPassword"],
      }
    );
};

export const resetFormSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export const blogSchema = z.object({
  _id: z.string().optional(),
  vendorId: z.string().min(24, "Invalid VendorId"),
  imageId: z.string().min(1, "Image is required."),
  user: z.string().min(2, "User name is too short."),
  date: z.string().min(1, "Please enter a valid date."),
  heading: z.string().min(1, "Please enter a heading."),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters."),
  category: z.string().min(2, "Please enter a proper category"),
  metaTitle: z.string().min(1, "Meta title is required."),
  metaDescription: z.string().min(1, "Meta description is required."),
  metaKeywords: z.string().optional(),
});

export const Address = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Name is too short"),
  contact: z
    .string()
    .regex(/^[0-9]+$/, "Contact number must contain only numbers")
    .max(10, "Only 10 digits are allowed"),
  type: z.string(),
  address_line_1: z.string().min(1, "Address line 1 is required"),
  address_line_2: z.string().min(1, "Address line 2 is required"),
  locality: z.string().min(1, "Locality is required"),
  pincode: z
    .string()
    .regex(/^[0-9]+$/, "Contact number must contain only numbers")
    .max(6, "Pincode should be only 6 digits"),
  state: z.string().min(1, "State is required"),
  landmark: z.string().optional(),
  alternativeContact: z.string().optional(),
});

export const storeAddressSchema = z.object({
  address_line_1: z.string().min(1, "Address line 1 is required"),
  address_line_2: z.string().min(1, "Address line 2 is required"),
  locality: z.string().min(1, "Locality is required"),
  pincode: z
    .string()
    .regex(/^[0-9]+$/, "Contact number must contain only numbers")
    .max(6, "Pincode should be only 6 digits"),
  state: z.string().min(1, "State is required"),
  landmark: z.string().optional(),
});

export const storeSchema = z.object({
  storeName: z.string().min(2, "Store name is too short"),
  contact: z
    .string()
    .regex(/^[0-9]+$/, "Contact number must contain only numbers")
    .max(10, "Only 10 digits are allowed"),
  address: storeAddressSchema,
  alternativeContact: z.string().optional(),
});

export const inquirySchema = z.object({
  name: z.string().nonempty(),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^[0-9]+$/, "Contact number must contain only numbers")
    .max(10, "Only 10 digits are allowed"),
  message: z.string().optional(),
});

export const parentCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  isActive: z.boolean().default(true),
});

export const primaryCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  parentCategory: z.string().nonempty("Parent category is required"),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const secondaryCategorySchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  attributes: z.tuple([z.string()]).rest(z.string()),
  parentCategory: z.string(),
  primaryCategory: z.string(),
  isActive: z.boolean(),
});

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageId: z.string().min(1, "Image is required."),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

// Define the Zod schema for product validation
export const productSchema = z
  .object({
    productName: z.string().min(1, "Product name is required"),
    vendorId: z.string().min(24, "Invalid VendorId"),
    slug: z.string().min(1, "Slug is required"),
    parentCategory: z.string().length(24, "Invalid parent category ID"),
    primaryCategory: z.string().length(24, "Invalid primary category ID"),
    secondaryCategory: z.string().length(24, "Invalid secondary category ID"),
    attributes: z
      .array(
        z.object({
          attributeId: z.union([
            z.string(),
            z
              .object({
                _id: z.string(),
              })
              .transform((obj) => obj._id),
          ]),
          value: z.string().min(1, "Value is required"),
          _id: z.string().optional(),
        })
      )
      .nonempty("At least one attribute is required"),
    brands: z.string().length(24, "Invalid brand ID"),
    productSize: z
      .array(
        z.object({
          sizeId: z.string().min(1, "Size is required"),
          mrp: z.number().positive("MRP must be a positive number"),
          landingPrice: z
            .number()
            .positive("Landing price must be a positive number"),
          discountType: z.enum(["percentage", "amount"]),
          discountValue: z
            .number()
            .nonnegative("Discount value must be non-negative"),
          gstType: z.enum(["inclusive", "exclusive"]).optional(),
          gstRate: z
            .number()
            .nonnegative("GST rate must be non-negative")
            .optional(),
          gstAmount: z.number().nonnegative("GST amount must be non-negative"),
          netPrice: z.number().positive("Net price must be a positive number"),
          deliveryCharges: z
            .number()
            .nonnegative("Delivery charges must be non-negative"),
          deliveryDays: z
            .number()
            .nonnegative("Delivery days must be non-negative"),
          quantity: z.number().nonnegative("Quantity must be non-negative"),
        })
      )
      .default([]),
    productSKU: z.string().min(1, "Product SKU is required"),
    productColor: z.string().optional(),
    productDescription: z.string().min(1, "Product description is required"),
    productImages: z
      .array(z.union([z.string(), z.instanceof(File)]))
      .min(1, "At least one product image is required"),
    productCoverImage: z
      .union([z.string(), z.instanceof(File)])
      .refine(
        (val) => val !== null && val !== undefined && val !== "",
        "Cover image is required"
      ),
    // Root-level pricing fields - optional when using size-based pricing
    mrp: z.number().positive("MRP must be a positive number").optional(),
    landingPrice: z
      .number()
      .positive("Base price must be a positive number")
      .optional(),
    discountType: z.enum(["percentage", "amount"]).default("percentage"),
    gstType: z.enum(["exclusive", "inclusive"]).default("exclusive"),
    gender: z.enum(["male", "female", "unisex", "not-applicable"]).optional(),
    discountValue: z
      .number()
      .nonnegative("Discount value must be a non-negative number")
      .default(0),
    gstRate: z
      .number()
      .nonnegative("GST rate must be a non-negative number")
      .default(0),
    gstAmount: z
      .number()
      .nonnegative("GST amount must be a non-negative number")
      .default(0),
    netPrice: z
      .number()
      .nonnegative("Net price must be a non-negative number")
      .default(0),
    deliveryCharges: z
      .number()
      .nonnegative("Delivery charges must be a non-negative number")
      .default(0),
    deliveryDays: z
      .number()
      .nonnegative("Delivery date must be a non-negative number")
      .default(0),
    productQuantity: z.coerce
      .number()
      .positive("Product quantity must be a positive number"),
    productStatus: z.boolean().default(true),
    productWarranty: z.string().optional(),
    productReturnPolicy: z.string().optional(),
    productRating: z.number().optional(),
    productReviews: z.array(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaKeywords: z.string().optional(),
    metaDescription: z.string().optional(),
  })
  .refine(
    (data) => {
      // Custom validation: Either use standard pricing OR size-based pricing
      const hasSizeBasedPricing =
        data.productSize && data.productSize.length > 0;
      const hasStandardPricing =
        data.mrp && data.mrp > 0 && data.landingPrice && data.landingPrice > 0;

      // At least one pricing method must be used
      if (!hasSizeBasedPricing && !hasStandardPricing) {
        return false;
      }

      return true;
    },
    {
      message:
        "Either standard pricing (MRP and Landing Price) or size-based pricing must be provided",
      path: ["mrp"], // This will show the error on the MRP field
    }
  );

export const adminProductSchema = z
  .object({
    productName: z.string().min(1, "Product name is required"),
    parentCategory: z.string().length(24, "Invalid parent category ID"),
    primaryCategory: z.string().length(24, "Invalid primary category ID"),
    secondaryCategory: z.string().length(24, "Invalid secondary category ID"),
    attributes: z
      .array(
        z.object({
          attributeId: z.union([
            z.string(),
            z
              .object({
                _id: z.string(),
              })
              .transform((obj) => obj._id),
          ]),
          value: z.string().min(1, "Value is required"),
          _id: z.string().optional(),
        })
      )
      .nonempty("At least one attribute is required"),
    brands: z.string().length(24, "Invalid brand ID"),
    productSize: z
      .array(
        z.object({
          sizeId: z.string().min(1, "Size is required"),
          mrp: z.number().positive("MRP must be a positive number"),
          landingPrice: z
            .number()
            .positive("Landing price must be a positive number"),
          discountType: z.enum(["percentage", "amount"]),
          discountValue: z
            .number()
            .nonnegative("Discount value must be non-negative"),
          gstType: z.enum(["inclusive", "exclusive"]).optional(),
          gstRate: z
            .number()
            .nonnegative("GST rate must be non-negative")
            .optional(),
          gstAmount: z.number().nonnegative("GST amount must be non-negative"),
          netPrice: z.number().positive("Net price must be a positive number"),
          deliveryCharges: z
            .number()
            .nonnegative("Delivery charges must be non-negative"),
          deliveryDays: z
            .number()
            .nonnegative("Delivery days must be non-negative"),
          quantity: z.number().nonnegative("Quantity must be non-negative"),
        })
      )
      .default([]),
    productSKU: z.string().min(1, "Product SKU is required"),
    productColor: z.string().optional(),
    productDescription: z.string().min(1, "Product description is required"),
    productImages: z
      .array(z.union([z.string(), z.instanceof(File)]))
      .min(1, "At least one product image is required"),
    productCoverImage: z
      .union([z.string(), z.instanceof(File)])
      .refine(
        (val) => val !== null && val !== undefined && val !== "",
        "Cover image is required"
      ),
    // Root-level pricing fields - optional when using size-based pricing
    mrp: z.number().positive("MRP must be a positive number").optional(),
    landingPrice: z
      .number()
      .positive("Base price must be a positive number")
      .optional(),
    discountType: z.enum(["percentage", "amount"]).default("percentage"),
    gstType: z.enum(["exclusive", "inclusive"]).default("exclusive"),
    gender: z.enum(["male", "female", "unisex", "not-applicable"]).optional(),
    discountValue: z
      .number()
      .nonnegative("Discount value must be a non-negative number")
      .default(0),
    gstRate: z
      .number()
      .nonnegative("GST rate must be a non-negative number")
      .default(0),
    gstAmount: z
      .number()
      .nonnegative("GST amount must be a non-negative number")
      .default(0),
    netPrice: z
      .number()
      .nonnegative("Net price must be a non-negative number")
      .default(0),
    deliveryCharges: z
      .number()
      .nonnegative("Delivery charges must be a non-negative number")
      .default(0),
    deliveryDays: z
      .number()
      .nonnegative("Delivery date must be a non-negative number")
      .default(0),
    productQuantity: z.coerce
      .number()
      .positive("Product quantity must be a positive number"),
    productStatus: z.boolean().default(true),
    productWarranty: z.string().optional(),
    productReturnPolicy: z.string().optional(),
    productRating: z.number().optional(),
    productReviews: z.array(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaKeywords: z.string().optional(),
    metaDescription: z.string().optional(),
  })
  .refine(
    (data) => {
      // Custom validation: Either use standard pricing OR size-based pricing
      const hasSizeBasedPricing =
        data.productSize && data.productSize.length > 0;
      const hasStandardPricing =
        data.mrp && data.mrp > 0 && data.landingPrice && data.landingPrice > 0;

      // At least one pricing method must be used
      if (!hasSizeBasedPricing && !hasStandardPricing) {
        return false;
      }

      return true;
    },
    {
      message:
        "Either standard pricing (MRP and Landing Price) or size-based pricing must be provided",
      path: ["mrp"], // This will show the error on the MRP field
    }
  );

export const discountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vendorId: z.string().min(24, "Invalid VendorId").optional(),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "amount"]),
  discountValue: z
    .number()
    .min(0, "Value must be positive")
    .or(z.string().regex(/^\d+$/).transform(Number)), // Allow string input but transform to number
  parentCategoryId: z.string().min(1, "Category is required"),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(true),
});

export const adminDiscountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "amount"]),
  discountValue: z
    .number()
    .min(0, "Value must be positive")
    .or(z.string().regex(/^\d+$/).transform(Number)), // Allow string input but transform to number
  parentCategoryId: z.string().min(1, "Category is required"),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(true),
});

export const referralFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  vendorId: z.string().min(1, "Vendor ID is required"),
  rewardPoints: z
    .number()
    .min(10, "Reward points must be at least 10")
    .max(10000, "Reward points cannot exceed 10,000"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  maxUses: z.number().min(1, "Maximum uses must be at least 1"),
  isActive: z.boolean(),
});

export const redeemPointsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  pointsToRedeem: z
    .number()
    .min(10, "Must redeem at least 10 points")
    .max(10000, "Cannot redeem more than 10,000 points"),
});

export const adminReferralFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  discountType: z.enum(["percentage", "amount"]),
  discountValue: z.number().min(0, "Discount value must be positive"),
  parentCategoryId: z.string().min(1, "Category is required"),
  expiryDate: z.string(),
  maxUses: z.number().int().min(1, "Maximum uses must be at least 1"),
  isActive: z.boolean().default(true),
});

export const vendorAddSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    isVerified: z.boolean().default(true),
    emailVerified: z.boolean().default(true), // Admin-created vendors have verified emails
    // Optional nested store fields
    store: z
      .object({
        storeName: z.string().min(2, "Store name is required").optional(),
        contact: z.string().min(10, "Store contact is required").optional(),
        addresses: z
          .object({
            address_line_1: z.string().min(1, "Address line 1 is required"),
            address_line_2: z.string().min(1, "Address line 2 is required"),
            locality: z.string().min(1, "Locality is required"),
            pincode: z.string().min(6, "Pincode must be at least 6 characters"),
            state: z.string().min(1, "State is required"),
            landmark: z.string().optional(),
          })
          .optional(),
        alternativeContact: z.string().optional(),
      })
      .optional(),
    bankDetails: z.object({
      bankName: z.string().min(2, "Bank name is required"),
      bankCode: z.string().min(2, "Bank code is required"),
      ifscCode: z
        .string()
        .min(11, "IFSC code must be 11 characters")
        .max(11, "IFSC code must be 11 characters")
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
      accountHolderName: z.string().min(2, "Account holder name is required"),
      accountNumber: z
        .string()
        .min(8, "Account number must be at least 8 digits"),
      accountType: z.enum(["savings", "current"], {
        required_error: "Account type is required",
      }),
    }),
    // Optional identity verification fields
    vendorIdentity: z
      .object({
        aadharCardNumber: z
          .string()
          .min(12, "Aadhar number must be 12 digits")
          .max(12, "Aadhar number must be 12 digits")
          .optional(),
        aadharCardDoc: z.union([z.string(), z.instanceof(File)]).optional(),
        panCard: z
          .string()
          .min(10, "PAN number must be 10 characters")
          .max(10, "PAN number must be 10 characters")
          .optional(),
        panCardDoc: z.union([z.string(), z.instanceof(File)]).optional(),
      })
      .optional(),
    // Optional business verification fields
    businessIdentity: z
      .object({
        MSMECertificate: z.union([z.string(), z.instanceof(File)]).optional(),
        UdhyamAadhar: z.union([z.string(), z.instanceof(File)]).optional(),
        Fassai: z.union([z.string(), z.instanceof(File)]).optional(),
        CorporationCertificate: z
          .union([z.string(), z.instanceof(File)])
          .optional(),
        OtherDocuments: z.union([z.string(), z.instanceof(File)]).optional(),
      })
      .optional(),
  })
  // Optionally, you could set additional fields here (e.g. isVerified) on the backend
  .strict();

export const vendorIdentitySchema = z.object({
  aadharCardNumber: z
    .string()
    .min(12, "Aadhar number must be 12 digits")
    .max(12, "Aadhar number must be 12 digits"),
  aadharCardDoc: z.string().min(1, "Aadhar card document is required"),
  panCard: z
    .string()
    .min(10, "PAN number must be 10 characters")
    .max(10, "PAN number must be 10 characters"),
  panCardDoc: z.string().min(1, "PAN card document is required"),
});

export const vendorAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  isVerified: z.boolean().default(false),
  emailVerified: z.boolean().default(true), // Admin-created vendors have verified emails
  store: z
    .object({
      storeName: z.string().min(2, "Store name is required").optional(),
      contact: z.string().min(10, "Store contact is required").optional(),
      addresses: z
        .object({
          address_line_1: z.string().min(1, "Address line 1 is required"),
          address_line_2: z.string().min(1, "Address line 2 is required"),
          locality: z.string().min(1, "Locality is required"),
          pincode: z.string().min(6, "Pincode must be at least 6 characters"),
          state: z.string().min(1, "State is required"),
          landmark: z.string().optional(),
        })
        .optional(),
      alternativeContact: z.string().optional(),
    })
    .optional(),
  bankDetails: z.object({
    bankName: z.string().min(2, "Bank name is required"),
    bankCode: z.string().min(2, "Bank code is required"),
    ifscCode: z
      .string()
      .min(11, "IFSC code must be 11 characters")
      .max(11, "IFSC code must be 11 characters")
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    accountHolderName: z.string().min(2, "Account holder name is required"),
    accountNumber: z
      .string()
      .min(8, "Account number must be at least 8 digits"),
    accountType: z.enum(["savings", "current"], {
      required_error: "Account type is required",
    }),
  }),
  // Optional identity verification fields
  vendorIdentity: z
    .object({
      aadharCardNumber: z
        .string()
        .min(12, "Aadhar number must be 12 digits")
        .max(12, "Aadhar number must be 12 digits")
        .optional(),
      aadharCardDoc: z.union([z.string(), z.instanceof(File)]).optional(),
      panCard: z
        .string()
        .min(10, "PAN number must be 10 characters")
        .max(10, "PAN number must be 10 characters")
        .optional(),
      panCardDoc: z.union([z.string(), z.instanceof(File)]).optional(),
    })
    .optional(),
  // Optional business verification fields
  businessIdentity: z
    .object({
      MSMECertificate: z.union([z.string(), z.instanceof(File)]).optional(),
      UdhyamAadhar: z.union([z.string(), z.instanceof(File)]).optional(),
      Fassai: z.union([z.string(), z.instanceof(File)]).optional(),
      CorporationCertificate: z
        .union([z.string(), z.instanceof(File)])
        .optional(),
      OtherDocuments: z.union([z.string(), z.instanceof(File)]).optional(),
    })
    .optional(),
});

export const vendorIdentityFormSchema = z.object({
  aadharCardNumber: z
    .string()
    .min(12, "Aadhar number must be 12 digits")
    .max(12, "Aadhar number must be 12 digits"),
  aadharCardDoc: z
    .union([z.string(), z.instanceof(File)])
    .refine(
      (val) => val !== null && val !== undefined && val !== "",
      "Aadhar card document is required"
    ),
  panCard: z
    .string()
    .min(10, "PAN number must be 10 characters")
    .max(10, "PAN number must be 10 characters"),
  panCardDoc: z
    .union([z.string(), z.instanceof(File)])
    .refine(
      (val) => val !== null && val !== undefined && val !== "",
      "PAN card document is required"
    ),
});

export const businessIdentityFormSchema = z.object({
  MSMECertificate: z.union([z.string(), z.instanceof(File)]).optional(),
  UdhyamAadhar: z.union([z.string(), z.instanceof(File)]).optional(),
  Fassai: z.union([z.string(), z.instanceof(File)]).optional(),
  CorporationCertificate: z.union([z.string(), z.instanceof(File)]).optional(),
  OtherDocuments: z.union([z.string(), z.instanceof(File)]),
});

export const businessIdentitySchema = z.object({
  MSMECertificate: z.string().optional(),
  UdhyamAadhar: z.string().optional(),
  Fassai: z.string().optional(),
  CorporationCertificate: z.string().optional(),
  OtherDocuments: z.string().optional(),
});
