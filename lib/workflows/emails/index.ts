// Shared utilities and configurations
export * from "./shared/config";
export * from "./shared/types";
export * from "./shared/templates";

// Order-related emails
export {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendVendorCancellationEmail,
  sendAdminCancellationEmail,
  sendOrderReadyToShipEmail,
} from "./order/orderEmails";

// Payment-related emails
export { sendPaymentFailureEmail } from "./payment/paymentEmails";

// User-related emails
export { sendWelcomeEmail, sendTemporaryPasswordEmail } from "./user/userEmails";
