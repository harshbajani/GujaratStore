import { Address } from "@/lib/validations";
import { Document, Schema, Types } from "mongoose";
import { Control } from "react-hook-form";
import { z } from "zod";

export interface IBlog extends Document {
  _id: string;
  vendorId: string;
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

export interface IAdminBlog extends Document {
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

export interface AdminTransformedBlog {
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

type DeliveryAddress = z.infer<typeof Address>;

export interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  editingAddress: DeliveryAddress | null;
  onSubmit: (data: DeliveryAddress) => Promise<void>;
}

export interface IPriceCalculatorProps {
  control: Control<IProduct>;
}

export interface IReferral {
  _id: string;
  name: string;
  description?: string;
  code: string;
  rewardPoints: number;
  vendorId: Schema.Types.ObjectId;
  expiryDate: Date | string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAdminReferral {
  _id: string;
  name: string;
  description?: string;
  code: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  parentCategory: {
    _id: string;
    name: string;
    isActive: boolean;
  };
  expiryDate: Date | string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Interfaces for different dashboard metrics
