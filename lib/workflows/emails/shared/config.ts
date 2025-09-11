import nodemailer from "nodemailer";
import { format } from "date-fns";

// Email configuration
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Common email constants
export const EMAIL_CONFIG = {
  FROM: process.env.SMTP_USER,
  FROM_EMAIL: process.env.SMTP_USER,
  SUPPORT_EMAIL: "contact@thegujaratstore.com",
  SUPPORT_PHONE: "+91-9876543210",
  LOGO_URL: "https://gujarat-store.vercel.app/_next/image?url=%2Flogo.png&w=128&q=75",
  APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
  COMPANY_NAME: "The Gujarat Store",
  BRAND_COLORS: {
    PRIMARY: "#C93326",
    SECONDARY: "#FA7275",
    ACCENT: "#E74C3C",
    SUCCESS: "#4CAF50",
    WARNING: "#FF9800",
    DANGER: "#E74C3C",
  },
};

// Utility functions
export const formatEmailDate = (dateString: string): string => {
  return format(new Date(dateString), "d MMM yyyy, h:mm a");
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// Create transporter instance
export const transporter = createEmailTransporter();

// Format order date (alias for formatEmailDate for backward compatibility)
export const formatOrderDate = formatEmailDate;

// Admin notification helper
export const notifyAdmin = async (subject: string, htmlContent: string): Promise<void> => {
  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: EMAIL_CONFIG.SUPPORT_EMAIL, // Use the contact email for admin notifications
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  console.log("Admin notification sent:", subject);
};
