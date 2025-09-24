// Base email data types
export type OrderEmailData = Pick<
  IOrder,
  | "orderId"
  | "items"
  | "subtotal"
  | "deliveryCharges"
  | "total"
  | "createdAt"
  | "paymentOption"
  | "discountAmount"
> & {
  userName: string;
  userEmail: string;
  email: string; // Added for compatibility
  orderDate: string; // Order date for formatting
  recipientType?: "user" | "vendor" | "admin";
  address: {
    name: string;
    contact: string;
    address_line_1: string;
    address_line_2: string;
    locality: string;
    state: string;
    pincode: string;
    type: string;
  };
  cancellationReason?: string;
  vendorId?: string;
};

export interface WelcomeEmailData {
  email: string;
  name: string;
  password: string;
}

export interface PaymentFailureEmailData {
  orderId: string;
  userName: string;
  userEmail: string;
  email: string;
  customerName: string;
  amount: string;
  paymentMethod: string;
  paymentId?: string;
  failureReason: string;
  errorCode?: string;
}

export interface CancellationEmailData extends OrderEmailData {
  cancellationReason: string;
  reason: string; // Alias for cancellationReason
  email: string;
  orderDate: string;
  customerName: string; // Alias for userName
  vendorEmail: string;
  paymentMethod: string;
  orderTotal: string;
  refundAmount: string;
}

export interface RefundEmailData {
  orderId: string;
  userName: string;
  userEmail: string;
  email: string;
  customerName: string;
  orderDate: string;
  orderTotal: string;
  refundAmount: string;
  refundId?: string;
  refundStatus: "initiated" | "processed" | "failed" | "manual_review";
  refundReason: string;
  paymentMethod: string;
  refundProcessingTime?: string;
  expectedCompletionDate?: string;
}

// Email template interfaces
export interface EmailTemplateParams {
  subject: string;
  to: string;
  html: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
