import {
  transporter,
  formatOrderDate,
  EMAIL_CONFIG,
  notifyAdmin,
} from "../shared/config";
import { OrderEmailData, CancellationEmailData } from "../shared/types";
import {
  wrapEmailTemplate,
  generateOrderInfoHTML,
  generateOrderItemsHTML,
  generateOrderTotalsHTML,
  generateDeliveryAddressHTML,
} from "../shared/templates";

/**
 * Send order confirmation email to customer
 */
export const sendOrderConfirmationEmail = async (
  orderData: OrderEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(orderData.createdAt);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${
          EMAIL_CONFIG.BRAND_COLORS.PRIMARY
        }; text-align: center; margin-top: 0;">
          🎉 Order Confirmed!
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          Thank you for your order! We're excited to get your Gujarat Store items to you soon.
        </p>

        ${generateOrderInfoHTML(orderData, formattedDate)}

        <h2 style="color: ${
          EMAIL_CONFIG.BRAND_COLORS.PRIMARY
        }; border-bottom: 2px solid ${
    EMAIL_CONFIG.BRAND_COLORS.SECONDARY
  }; padding-bottom: 10px; margin-top: 30px;">
          Order Items
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          ${generateOrderItemsHTML(orderData.items)}
        </table>

        ${generateOrderTotalsHTML(orderData)}

        <div style="background-color: ${
          EMAIL_CONFIG.BRAND_COLORS.SECONDARY
        }; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #333;">What's Next?</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            We'll send you another email with tracking information once your order ships. 
            You can also track your order status anytime in your account.
          </p>
        </div>
      </td>
    </tr>
    ${generateDeliveryAddressHTML(orderData.address)}
  `;

  const htmlTemplate = wrapEmailTemplate("Order Confirmation", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: orderData.userEmail,
    subject: `Order Confirmed - ${orderData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Order confirmation email sent to ${orderData.userEmail} for order ${orderData.orderId}`
  );
};

/**
 * Send order cancellation email to customer
 */
export const sendOrderCancellationEmail = async (
  cancellationData: CancellationEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(cancellationData.createdAt);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #e74c3c; text-align: center; margin-top: 0;">
          ❌ Order Cancelled
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          We're sorry to inform you that your order has been cancelled.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${
    cancellationData.orderId
  }</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order Date:</strong> 
              <span>${formattedDate}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Cancellation Reason:</strong> 
              <span>${cancellationData.cancellationReason}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #856404;">Refund Information</h3>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ${
              cancellationData.paymentOption === "cash-on-delivery"
                ? "Since this was a Cash on Delivery order, no refund is required."
                : `Your refund of ₹${cancellationData.total.toLocaleString(
                    "en-IN"
                  )} will be processed within 5-7 business days to your original payment method.`
            }
          </p>
        </div>

        <div style="background-color: ${
          EMAIL_CONFIG.BRAND_COLORS.SECONDARY
        }; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: white;">We're Sorry!</h3>
          <p style="margin: 0; font-size: 14px; color: white;">
            We sincerely apologize for any inconvenience caused. 
            Feel free to browse our collection again for other amazing products!
          </p>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate("Order Cancelled", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: cancellationData.userEmail,
    subject: `Order Cancelled - ${cancellationData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Order cancellation email sent to ${cancellationData.userEmail} for order ${cancellationData.orderId}`
  );
};

/**
 * Send vendor cancellation notification email
 */
export const sendVendorCancellationEmail = async (
  cancellationData: CancellationEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(cancellationData.createdAt);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #e74c3c; text-align: center; margin-top: 0;">
          🚫 Order Cancelled - Vendor Notification
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          An order for your products has been cancelled by the vendor.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${
    cancellationData.orderId
  }</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Customer:</strong> 
              <span>${cancellationData.userName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order Date:</strong> 
              <span>${formattedDate}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Cancellation Reason:</strong> 
              <span>${cancellationData.cancellationReason}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Refund Amount:</strong> 
              <span>₹${cancellationData.total.toLocaleString("en-IN")}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #721c24;">Action Required</h3>
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            Please ensure you do not ship any items for this cancelled order. 
            If items have already been prepared for shipping, please contact our support team immediately.
          </p>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    "Order Cancelled - Vendor Notification",
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: "vendor@example.com", // TODO: Get actual vendor email from order data
    subject: `Order Cancelled - ${cancellationData.orderId} - Vendor Notification`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send admin cancellation notification email
 */
export const sendAdminCancellationEmail = async (
  cancellationData: CancellationEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(cancellationData.createdAt);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #e74c3c; text-align: center; margin-top: 0;">
          🛑 Order Cancelled - Admin Alert
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          An order has been cancelled by the admin team.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${
    cancellationData.orderId
  }</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Customer:</strong> 
              <span>${cancellationData.userName} (${
    cancellationData.userEmail
  })</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Vendor:</strong> 
              <span>vendor@example.com</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order Date:</strong> 
              <span>${formattedDate}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment Method:</strong> 
              <span>${cancellationData.paymentOption}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order Total:</strong> 
              <span>₹${cancellationData.total.toLocaleString("en-IN")}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Refund Amount:</strong> 
              <span>₹${cancellationData.total.toLocaleString("en-IN")}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Cancellation Reason:</strong> 
              <span>${cancellationData.cancellationReason}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">Admin Notes</h3>
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            • Review the cancellation reason for patterns<br>
            • Verify refund processing if payment was made<br>
            • Check with vendor if items were already prepared for shipping<br>
            • Update order analytics and inventory if needed
          </p>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    "Order Cancelled - Admin Alert",
    content
  );

  await notifyAdmin("Order Cancelled - Admin Alert", htmlTemplate);
  console.log(
    `Admin cancellation notification sent for order ${cancellationData.orderId}`
  );
};

/**
 * Send order ready to ship email to customer
 */
export const sendOrderReadyToShipEmail = async (
  orderData: OrderEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(orderData.createdAt);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${
          EMAIL_CONFIG.BRAND_COLORS.SUCCESS
        }; text-align: center; margin-top: 0;">
          📦 Order Ready to Ship!
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          Great news! Your order has been picked from our store and is ready to ship.
        </p>

        ${generateOrderInfoHTML(orderData, formattedDate)}

        <h2 style="color: ${
          EMAIL_CONFIG.BRAND_COLORS.PRIMARY
        }; border-bottom: 2px solid ${
    EMAIL_CONFIG.BRAND_COLORS.SECONDARY
  }; padding-bottom: 10px; margin-top: 30px;">
          Order Items
        </h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          ${generateOrderItemsHTML(orderData.items)}
        </table>

        ${generateOrderTotalsHTML(orderData)}

        <div style="background-color: ${
          EMAIL_CONFIG.BRAND_COLORS.SECONDARY
        }; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #333;">What's Next?</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Your order will be shipped soon and you'll receive tracking information once it's on the way.
            Thank you for your patience!
          </p>
        </div>
      </td>
    </tr>
    ${generateDeliveryAddressHTML(orderData.address)}
  `;

  const htmlTemplate = wrapEmailTemplate("Order Ready to Ship", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: orderData.userEmail,
    subject: `Order Ready to Ship - ${orderData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Order ready to ship email sent to ${orderData.userEmail} for order ${orderData.orderId}`
  );
};
