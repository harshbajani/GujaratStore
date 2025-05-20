declare interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

declare interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone: string;
  password: string;
  addresses: IAddress[];
  referral?: string;
  rewardPoints?: number;
  referralUsed?: string;
  role: "user";
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  wishlist?: (Types.ObjectId | string)[];
  cart?: (Types.ObjectId | string)[];
  order?: (Types.ObjectId | string)[];
  __v: number;
}

declare interface ProfileProps {
  initialData: UserResponse;
  onProfileUpdate: (updatedUser: UserResponse) => void;
}

declare interface IVendor {
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

declare type UserResponse = Omit<
  IUser,
  "password" | "verificationToken" | "verificationTokenExpiry"
>;

declare type VendorResponse = Omit<
  IVendor,
  "password" | "verificationToken" | "verificationTokenExpiry"
>;

declare interface ActionResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

declare interface ImageItem {
  src: string;
  label: string;
}

declare interface ContentItem {
  bg: string;
  title: string;
  description: string;
}

declare interface CollectionItemProps {
  item: ImageItem | ContentItem;
  isImageType: boolean;
  index: number;
}

declare interface IAddress {
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

declare type StoreData = {
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

declare interface IStore {
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

declare interface AddressCardProps {
  type: string;
  name: string;
  contact: string;
  address: string;
  onEdit: () => void;
  onDelete: () => void;
}

declare interface AttributeFormData {
  id: string;
  name: string;
  vendorId: string;
  isActive: boolean;
}

declare interface ParentCategoryFormData {
  id: string;
  name: string;
  isActive: boolean;
}

declare interface IAttribute {
  id: string;
  _id: string;
  name: string;
  isActive: boolean;
}

declare interface IParentCategory {
  id: string;
  _id: string;
  name: string;
  isActive: boolean;
}

declare interface IPrimaryCategory {
  id?: string;
  name: string;
  parentCategory: string;
  description?: string;
  metaTitle?: string;
  metaKeywords?: string[];
  metaDescription?: string;
  isActive: boolean;
}

declare interface ISecondaryCategory {
  id?: string;
  name: string;
  parentCategory: string;
  primaryCategory: string;
  attributes: string[];
  description?: string;
  isActive: boolean;
}

declare interface IProductSecondaryCategory {
  id?: string;
  name: string;
  parentCategory: string;
  primaryCategory: string;
  attributes: IAttribute[];
  description?: string;
  isActive: boolean;
}

declare type PrimaryCategoryWithPopulatedFields = IPrimaryCategory & {
  id: string; // Ensure you have an id field
  parentCategory: {
    _id: string;
    name: string;
  };
};

declare type SecondaryCategoryWithPopulatedFields = ISecondaryCategory & {
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

declare interface IBrand {
  _id?: string;
  name: string;
  imageId: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  __v?: number;
}

declare interface IAdminBrand {
  _id?: string;
  name: string;
  imageId: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
  __v?: number;
}

declare interface ISizes {
  _id?: string;
  label: string;
  value: string;
  isActive: boolean;
}

declare interface IProduct {
  _id?: string;
  vendorId: string;
  productName: string;
  parentCategory: string; // MongoDB ObjectId as string
  primaryCategory: string; // MongoDB ObjectId as string
  secondaryCategory: string; // MongoDB ObjectId as string
  attributes: Array<{ attributeId: string; value: string }>;
  brands: string; // MongoDB ObjectId as string
  productSKU: string;
  productColor?: string;
  productSize?: string[];
  productDescription: string;
  productImages: (string | File)[];
  productCoverImage: string | File;
  mrp: number;
  basePrice: number;
  discountType: "percentage" | "amount";
  gender?: "male" | "female" | "unisex" | "not-applicable";
  discountValue: number;
  gstRate: number;
  gstAmount: number;
  netPrice: number;
  deliveryCharges: number;
  deliveryDays: number;
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

declare interface IAdminProduct {
  _id?: string;
  vendorId: string;
  productName: string;
  parentCategory: string; // MongoDB ObjectId as string
  primaryCategory: string; // MongoDB ObjectId as string
  secondaryCategory: string; // MongoDB ObjectId as string
  attributes: Array<{ attributeId: string; value: string }>;
  brands: string; // MongoDB ObjectId as string
  productSKU: string;
  productColor?: string;
  productSize?: string[];
  productDescription: string;
  productImages: (string | File)[];
  productCoverImage: string | File;
  mrp: number;
  basePrice: number;
  discountType: "percentage" | "amount";
  gender?: "male" | "female" | "unisex" | "not-applicable";
  discountValue: number;
  gstRate: number;
  gstAmount: number;
  netPrice: number;
  deliveryCharges: number;
  deliveryDays: number;
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

declare type ProductWithPopulatedFields = IProduct & {
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

declare interface IProductResponse {
  _id?: string;
  productName: string;
  vendorId: string;
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
  attributes: {
    attributeId: { _id: string; name: string };
    _id: string;
    value: string;
  }[];
  brands: {
    _id: string;
    name: string;
  };
  productSKU: string;
  productSize?: {
    _id: string;
    label: string;
    isActive: boolean;
  }[];
  productColor?: string;
  productDescription: string;
  productImages: (string | File)[];
  productCoverImage: string | File;
  mrp: number;
  basePrice: number;
  discountType: "percentage" | "amount";
  gender?: "male" | "female" | "unisex" | "not-applicable";
  discountValue: number;
  gstRate: number;
  gstAmount: number;
  netPrice: number;
  deliveryCharges: number;
  deliveryDays: number;
  productQuantity: number;
  productStatus?: boolean;
  productRating?: number;
  productReviews?: {
    _id: string;
    rating: number;
  };
  productWarranty?: string;
  productReturnPolicy?: string;
  wishlist?: boolean;
  inCart?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

declare interface IProductReview {
  _id?: string;
  userId: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

declare interface CheckoutItem {
  productId: string;
  productName: string;
  selectedSize?: string;
  quantity: number;
  price: number;
  coverImage: string;
  deliveryDate: string;
}

declare interface CheckoutData {
  items: CheckoutItem[];
  subtotal: number;
  deliveryCharges: number;
  discountAmount: number;
  discountCode: string;
  total: number;
}

declare interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  coverImage: string;
  quantity: number;
  price: number;
  deliveryDate: string;
}

declare interface IOrder {
  _id: string;
  orderId: string;
  status: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  total: number;
  addressId: string;
  paymentOption: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

enum DiscountType {
  PERCENTAGE = "percentage",
  AMOUNT = "amount",
}

declare interface IDiscount {
  id: string;
  _id: string;
  name: string;
  vendorId: Schema.Types.ObjectId;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: "category";
  parentCategory: {
    _id: string;
    name: string;
    isActive: boolean;
  };

  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare interface IAdminDiscount {
  id: string;
  _id: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: "category";
  parentCategory: {
    _id: string;
    name: string;
    isActive: boolean;
  };
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare interface ISalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: { [month: string]: number };
  yearlyRevenue: { [year: number]: number };
  revenueChangePercent: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

declare interface IOrderStatusBreakdown {
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
}

declare interface IProductInventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryValueTotal: number;
  lowStockProductDetails?: {
    name: string;
    quantity: number;
  }[];
}

declare interface IDashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendDirection?: "up" | "down";
}
