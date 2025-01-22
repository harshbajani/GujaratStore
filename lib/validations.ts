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
