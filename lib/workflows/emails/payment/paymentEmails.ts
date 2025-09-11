import { transporter, EMAIL_CONFIG, notifyAdmin } from "../shared/config";
import { PaymentFailureEmailData } from "../shared/types";
import { wrapEmailTemplate } from "../shared/templates";

/**
 * Send payment failure email to customer
 */
export const sendPaymentFailureEmail = async (failureData: PaymentFailureEmailData): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #e74c3c; text-align: center; margin-top: 0;">
          ⚠️ Payment Failed
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          We encountered an issue processing your payment for order ${failureData.orderId}.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${failureData.orderId}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Amount:</strong> 
              <span>${failureData.amount}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment Method:</strong> 
              <span>${failureData.paymentMethod}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Failure Reason:</strong> 
              <span style="color: #e74c3c;">${failureData.failureReason}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #721c24;">What happened?</h3>
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            ${failureData.failureReason}
          </p>
        </div>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.SECONDARY}; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 15px; color: #333;">Ready to try again?</h3>
          <p style="margin: 0 0 20px; color: #666; font-size: 14px;">
            Your items are still reserved in your cart. You can complete your purchase anytime.
          </p>
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/cart" 
             style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Complete Payment
          </a>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">Need Help?</h3>
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            • Check your payment method details<br>
            • Ensure sufficient funds are available<br>
            • Try using a different payment method<br>
            • Contact your bank if the issue persists
          </p>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate("Payment Failed", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: failureData.userEmail,
    subject: `Payment Failed - Order ${failureData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Payment failure email sent to ${failureData.userEmail} for order ${failureData.orderId}`);

  // Also notify admin about the payment failure
  await notifyAdminOfPaymentFailure(failureData);
};

/**
 * Notify admin about payment failure for tracking and analytics
 */
const notifyAdminOfPaymentFailure = async (failureData: PaymentFailureEmailData): Promise<void> => {
  const adminContent = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #e74c3c; text-align: center; margin-top: 0;">
          💳 Payment Failure Alert
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          A payment failure occurred and requires admin attention.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${failureData.orderId}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Customer:</strong> 
              <span>${failureData.userName} (${failureData.userEmail})</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Amount:</strong> 
              <span>${failureData.amount}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment Method:</strong> 
              <span>${failureData.paymentMethod}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment ID:</strong> 
              <span>${failureData.paymentId || "N/A"}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Failure Reason:</strong> 
              <span style="color: #e74c3c;">${failureData.failureReason}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Error Code:</strong> 
              <span>${failureData.errorCode || "N/A"}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Timestamp:</strong> 
              <span>${new Date().toISOString()}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">Admin Action Items</h3>
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            • Monitor payment failure patterns<br>
            • Check if payment gateway is functioning properly<br>
            • Review customer's payment history<br>
            • Follow up with customer if needed<br>
            • Update analytics and failure tracking
          </p>
        </div>
      </td>
    </tr>
  `;

  const adminHtmlTemplate = wrapEmailTemplate("Payment Failure Alert", adminContent);
  await notifyAdmin("Payment Failure Alert - Order " + failureData.orderId, adminHtmlTemplate);
  console.log(`Admin payment failure notification sent for order ${failureData.orderId}`);
};
