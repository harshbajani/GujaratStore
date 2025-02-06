import { IAttribute } from "@/lib/actions/attribute.actions";
import { Address } from "@/lib/validations";
import { Document, Types } from "mongoose";
import { Control } from "react-hook-form";
import { z } from "zod";

export interface IOTPDocument {
  email: string;
  otp: string;
  userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  };
  createdAt: Date;
}

export interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user";
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  wishlist?: (Types.ObjectId | string)[];
  __v: number;
}

export interface ProfileProps {
  initialData: UserResponse;
  onProfileUpdate: (updatedUser: UserResponse) => void;
}

export interface IVendor {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "vendor";
  store: IStore;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  __v: number;
}

export type UserResponse = Omit<
  IUser,
  "password" | "verificationToken" | "verificationTokenExpiry"
>;

export type VendorResponse = Omit<
  IVendor,
  "password" | "verificationToken" | "verificationTokenExpiry"
>;

export interface ActionResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ImageItem {
  src: string;
  label: string;
}

export interface ContentItem {
  bg: string;
  title: string;
  description: string;
}

export interface CollectionItemProps {
  item: ImageItem | ContentItem;
  isImageType: boolean;
  index: number;
}

export interface IBlog extends Document {
  _id: Types.ObjectId;
  imageId: string;
  user: string;
  date: string;
  heading: string;
  description: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransformedBlog {
  id: string;
  imageId: string;
  user: string;
  date: string;
  heading: string;
  description: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export interface IAddress {
  _id?: string;
  name: string;
  contact: string;
  type: string;
  address_line_1: string;
  address_line_2: string;
  locality: string;
  pincode: string;
  state: string;
  landmark?: string;
  alternativeContact?: string;
}

export type StoreData = {
  storeName: string;
  contact: string;
  address: {
    address_line_1: string;
    address_line_2: string;
    locality: string;
    pincode: string;
    state: string;
    landmark?: string;
  };
  alternativeContact?: string;
};

export interface IStore {
  _id?: string;
  storeName: string;
  contact: string;
  address: {
    address_line_1: string;
    address_line_2: string;
    locality: string;
    pincode: string;
    state: string;
    landmark?: string;
  };
  alternativeContact: string;
}

type DeliveryAddress = z.infer<typeof Address>;

export interface AddressCardProps {
  type: string;
  name: string;
  contact: string;
  address: string;
  onEdit: () => void;
  onDelete: () => void;
}

export interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  editingAddress: DeliveryAddress | null;
  onSubmit: (data: DeliveryAddress) => Promise<void>;
}

export interface AttributeFormData {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ParentCategoryFormData {
  id: string;
  name: string;
  isActive: boolean;
}

export interface IPrimaryCategory {
  id?: string;
  name: string;
  parentCategory: string;
  description?: string;
  metaTitle?: string;
  metaKeywords?: string[];
  metaDescription?: string;
  isActive: boolean;
}

export interface ISecondaryCategory {
  id?: string;
  name: string;
  parentCategory: string;
  primaryCategory: string;
  attributes: string[];
  description?: string;
  isActive: boolean;
}

export interface IProductSecondaryCategory {
  id?: string;
  name: string;
  parentCategory: string;
  primaryCategory: string;
  attributes: IAttribute[];
  description?: string;
  isActive: boolean;
}

export type SecondaryCategoryWithPopulatedFields = ISecondaryCategory & {
  id: string; // Ensure you have an id field
  parentCategory: {
    _id: string;
    name: string;
  };
  primaryCategory: {
    _id: string;
    name: string;
  };
  attributes: {
    _id: string;
    name: string;
  }[];
};

export type PrimaryCategoryWithPopulatedFields = IPrimaryCategory & {
  id: string; // Ensure you have an id field
  parentCategory: {
    _id: string;
    name: string;
  };
};

export interface IBrand {
  _id?: string;
  name: string;
  imageId: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  __v?: number;
}

export interface IProduct {
  _id?: string;
  productName: string;
  parentCategory: string; // MongoDB ObjectId as string
  primaryCategory: string; // MongoDB ObjectId as string
  secondaryCategory: string; // MongoDB ObjectId as string
  attributes: Array<{ attributeId: string; value: string }>;
  brands: string; // MongoDB ObjectId as string
  productSKU: string;
  productColor: string;
  productDescription: string;
  productImages: (string | File)[];
  productCoverImage: string | File;
  mrp: number;
  basePrice: number;
  discountType: "percentage" | "amount";
  gender?: "male" | "female" | "unisex";
  discountValue: number;
  gstRate: number;
  gstAmount: number;
  netPrice: number;
  productQuantity: number;
  productStatus?: boolean;
  productRating?: number;
  productReviews?: string[]; // Optional array of MongoDB ObjectIds as strings
  productWarranty?: string;
  productReturnPolicy?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export type ProductWithPopulatedFields = IProduct & {
  id: string; // Ensure you have an id field
  parentCategory: {
    _id: string;
    name: string;
  };
  primaryCategory: {
    _id: string;
    name: string;
  };
  secondaryCategory: {
    _id: string;
    name: string;
  };
  brands: {
    _id: string;
    name: string;
  };
};

export interface IPriceCalculatorProps {
  control: Control<IProduct>;
}
