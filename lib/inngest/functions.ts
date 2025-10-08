/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "./client";
import {
  sendWelcomeEmail,
  sendTemporaryPasswordEmail,
  sendMissYouEmail,
} from "@/lib/workflows/emails/user/userEmails";
import { sendOrderEmails } from "@/services/vendor.service";
import {
  sendOrderCancellationEmail,
  sendOrderReadyToShipEmail,
  sendVendorCancellationEmail,
  sendAdminCancellationEmail,
} from "@/lib/workflows/emails/order/orderEmails";
import {
  sendRefundInitiatedEmail,
  sendRefundProcessedEmail,
  sendRefundFailedEmail,
  sendRefundUnderReviewEmail,
} from "@/lib/workflows/emails/order/refundEmails";
import { sendShippingNotificationEmail } from "@/lib/workflows/emails/shipping/shippingEmails";
import { sendPaymentFailureEmail } from "@/lib/workflows/emails/payment/paymentEmails";
import type {
  OrderEmailData,
  CancellationEmailData,
  RefundEmailData,
  PaymentFailureEmailData,
} from "@/lib/workflows/emails/shared/types";
import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";

// Inngest function: Send welcome email when a user is verified/created
export const userWelcomeEmail = inngest.createFunction(
  { id: "user-welcome-email" },
  { event: "app/user.welcome" },
  async ({ event, step }) => {
    await step.run("send-welcome-email", async () => {
      const { email, name } = event.data as { email: string; name: string };
      // sendWelcomeEmail expects a password field in the payload type but doesn't use it.
      await sendWelcomeEmail({ email, name, password: "" });
      return true;
    });

    return { success: true };
  }
);

// Inngest function: Send guest temporary password email
export const guestTemporaryPasswordEmail = inngest.createFunction(
  { id: "guest-temporary-password-email" },
  { event: "app/user.guest_password_issued" },
  async ({ event, step }) => {
    await step.run("send-guest-temp-password-email", async () => {
      const { email, name, password } = event.data as {
        email: string;
        name: string;
        password: string;
      };
      await sendTemporaryPasswordEmail({ email, name, password });
      return true;
    });

    return { success: true };
  }
);

// Inngest function: Order confirmation (user, admin, vendor)
export const orderConfirmationEmails = inngest.createFunction(
  { id: "order-confirmation-emails" },
  { event: "app/order.confirmed" },
  async ({ event, step }) => {
    await step.run("send-order-confirmation-emails", async () => {
      const orderData = event.data as OrderEmailData;
      // Reuse existing service to fan-out emails
      const res = await sendOrderEmails(orderData as any);
      if (!res.success)
        throw new Error(res.error || "Failed to send order emails");
      return true;
    });
    return { success: true };
  }
);

// Inngest function: Order cancelled (customer email)
export const orderCancellationEmail = inngest.createFunction(
  { id: "order-cancellation-email" },
  { event: "app/order.cancelled" },
  async ({ event, step }) => {
    await step.run("send-order-cancellation-email", async () => {
      const cancellationData = event.data as CancellationEmailData;
      await sendOrderCancellationEmail(cancellationData as any);
      return true;
    });
    return { success: true };
  }
);

// Inngest function: Refund status emails (initiated/processed/failed/manual_review)
export const orderRefundEmail = inngest.createFunction(
  { id: "order-refund-email" },
  { event: "app/order.refund" },
  async ({ event, step }) => {
    await step.run("send-refund-email", async () => {
      const data = event.data as RefundEmailData & { refundStatus: string };
      switch (data.refundStatus) {
        case "processed":
          await sendRefundProcessedEmail(data);
          break;
        case "failed":
          await sendRefundFailedEmail(data);
          break;
        case "manual_review":
          await sendRefundUnderReviewEmail(data);
          break;
        default:
          await sendRefundInitiatedEmail(data);
      }
      return true;
    });
    return { success: true };
  }
);

// Inngest function: Ready-to-ship email to customer
export const orderReadyToShipEmail = inngest.createFunction(
  { id: "order-ready-to-ship-email" },
  { event: "app/order.ready_to_ship" },
  async ({ event, step }) => {
    await step.run("send-order-ready-to-ship-email", async () => {
      const data = event.data as OrderEmailData;
      await sendOrderReadyToShipEmail(data as any);
      return true;
    });
    return { success: true };
  }
);

// Inngest function: Admin cancellation notification
export const orderAdminCancellationEmail = inngest.createFunction(
  { id: "order-admin-cancellation-email" },
  { event: "app/order.cancelled.admin" },
  async ({ event, step }) => {
    await step.run("send-admin-cancellation-email", async () => {
      const data = event.data as CancellationEmailData;
      await sendAdminCancellationEmail(data as any);
      return true;
    });
    return { success: true };
  }
);

// Inngest function: Vendor cancellation notification
export const orderVendorCancellationEmail = inngest.createFunction(
  { id: "order-vendor-cancellation-email" },
  { event: "app/order.cancelled.vendor" },
  async ({ event, step }) => {
    await step.run("send-vendor-cancellation-email", async () => {
      const data = event.data as CancellationEmailData;
      await sendVendorCancellationEmail(data as any);
      return true;
    });
    return { success: true };
  }
);

// Inngest function: Shipping status notification (shipped, in_transit, out_for_delivery, delivered)
export const paymentFailureEmail = inngest.createFunction(
  { id: "payment-failure-email" },
  { event: "app/payment.failed" },
  async ({ event, step }) => {
    await step.run("send-payment-failure-email", async () => {
      const data = event.data as PaymentFailureEmailData;
      await sendPaymentFailureEmail(data);
      return true;
    });
    return { success: true };
  }
);

// Scheduled: Send "miss you" emails to inactive users (7+ days)
export const sendInactiveUserEmails = inngest.createFunction(
  { id: "inactive-user-emails" },
  { cron: "0 9 * * *" }, // daily at 09:00 UTC
  async ({ step }) => {
    await step.run("send-miss-you-batch", async () => {
      await connectToDB();
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Find users with lastLoginAt older than cutoff OR no lastLoginAt but createdAt older than cutoff
      const users = await User.find({
        $or: [
          { lastLoginAt: { $lt: cutoff } },
          {
            $and: [
              {
                $or: [
                  { lastLoginAt: { $exists: false } },
                  { lastLoginAt: null },
                ],
              },
              { createdAt: { $lt: cutoff } },
            ],
          },
        ],
      })
        .select("email name")
        .limit(1000)
        .lean<{ email: string; name: string }[]>();

      for (const u of users) {
        try {
          await sendMissYouEmail({ email: u.email, name: u.name });
        } catch (e) {
          console.error("Failed to send miss-you email to", u.email, e);
        }
      }
      return true;
    });
    return { success: true };
  }
);

export const shippingStatusNotification = inngest.createFunction(
  { id: "shipping-status-notification" },
  { event: "app/shipping.notification" },
  async ({ event, step }) => {
    await step.run("send-shipping-notification", async () => {
      const { notificationType, emailData } = event.data as {
        notificationType: string;
        emailData: any; // conforms to ShippingEmailData
      };
      await sendShippingNotificationEmail(notificationType, emailData);
      return true;
    });
    return { success: true };
  }
);
