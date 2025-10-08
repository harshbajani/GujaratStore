import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";
import {
  userWelcomeEmail,
  guestTemporaryPasswordEmail,
  orderConfirmationEmails,
  orderCancellationEmail,
  orderRefundEmail,
  shippingStatusNotification,
  orderReadyToShipEmail,
  orderAdminCancellationEmail,
  orderVendorCancellationEmail,
  paymentFailureEmail,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    userWelcomeEmail,
    guestTemporaryPasswordEmail,
    orderConfirmationEmails,
    orderCancellationEmail,
    orderRefundEmail,
    orderReadyToShipEmail,
    orderAdminCancellationEmail,
    orderVendorCancellationEmail,
    paymentFailureEmail,
    shippingStatusNotification,
  ],
});
