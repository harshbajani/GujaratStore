import { features } from "@/constants";
import { deliveryAddress } from "@/lib/validations";
import { Document, Types } from "mongoose";
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
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  wishlist?: (Types.ObjectId | string)[];
}

export type UserResponse = Omit<
  IUser,
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

export interface Blog {
  id: string;
  image: string;
  heading: string;
  user: string;
  date: string;
  description: string;
  category: string;
}

export interface FeaturesAndBlogsProps {
  blogs: Blog[];
  features: typeof features;
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
  image: string;
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

type DeliveryAddress = z.infer<typeof deliveryAddress>;

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
