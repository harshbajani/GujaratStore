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
          ? z.string().min(10).max(15)
          : z.string().optional(),
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
  isActive: z.boolean().default(true),
});

export const primaryCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentCategory: z.string().nonempty("Parent category is required"),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const secondaryCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentCategory: z.string().nonempty("Parent category is required"),
  primaryCategory: z.string().nonempty("Primary category is required"),
  attributes: z
    .array(z.string())
    .nonempty("At least one attribute is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageId: z.string().min(1, "Image is required."),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

// Define the Zod schema for product validation
export const productSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  parentCategory: z.string().length(24, "Invalid parent category ID"),
  primaryCategory: z.string().length(24, "Invalid primary category ID"),
  secondaryCategory: z.string().length(24, "Invalid secondary category ID"),
  attributes: z
    .array(
      z.object({
        attributeId: z.string().length(24, "Invalid attribute ID"),
        value: z.string().min(1, "Value is required"),
        _id: z.string().optional(),
      })
    )
    .nonempty("At least one attribute is required"),
  brands: z.string().length(24, "Invalid brand ID"),
  productSize: z.array(z.string().optional()),
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
  mrp: z.number().positive("MRP must be a positive number"),
  basePrice: z.number().positive("Base price must be a positive number"),
  discountType: z.enum(["percentage", "amount"]),
  gender: z.enum(["male", "female", "unisex", "not-applicable"]).optional(),
  discountValue: z
    .number()
    .nonnegative("Discount value must be a non-negative number"),
  gstRate: z.number().nonnegative("GST rate must be a non-negative number"),
  gstAmount: z.number().nonnegative("GST amount must be a non-negative number"),
  netPrice: z.number().nonnegative("Net price must be a non-negative number"),
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
});
