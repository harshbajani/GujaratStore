import { features } from "@/constants";
import { Types } from "mongoose";

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
  gender?: "male" | "female" | "other";
  shippingAddresses?: Array<{
    _id?: Types.ObjectId | string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    landmark: string;
    pincode: string;
    isDefault: boolean;
  }>;
  dateOfBirth?: Date;
  profileImage?: string;
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

export interface TransformedBlog {
  id: string;
  image: string;
  heading: string;
  user: string;
  date: string;
  description: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export interface MongoDBBlog {
  _id: string;
  imageId: string;
  heading: string;
  user: string;
  date: string;
  description: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  createdAt: Date;
  updatedAt: Date;
}
