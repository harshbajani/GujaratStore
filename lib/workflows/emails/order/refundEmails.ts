import { transporter, formatOrderDate, EMAIL_CONFIG } from "../shared/config";
import { RefundEmailData } from "../shared/types";
import { wrapEmailTemplate } from "../shared/templates";

/**
 * Send refund initiation email to customer
 */
export const sendRefundInitiatedEmail = async (
  refundData: RefundEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(refundData.orderDate);
  const expectedCompletion =
    refundData.expectedCompletionDate ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${
          EMAIL_CONFIG.BRAND_COLORS.PRIMARY
        }; text-align: center; margin-top: 0;">
          💰 Refund Initiated
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          We've initiated your refund for the cancelled order. Here are the details:
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${
    refundData.orderId
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
              <strong style="color: #333;">Original Amount:</strong> 
              <span>₹${refundData.orderTotal}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Refund Amount:</strong> 
              <span style="color: ${
                EMAIL_CONFIG.BRAND_COLORS.SUCCESS
              }; font-weight: bold;">₹${refundData.refundAmount}</span>
            </td>
          </tr>
          ${
            refundData.refundId
              ? `
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Refund ID:</strong> 
              <span style="font-family: monospace; background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${refundData.refundId}</span>
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment Method:</strong> 
              <span>${refundData.paymentMethod}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Refund Reason:</strong> 
              <span>${refundData.refundReason}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">📋 Refund Processing Information</h3>
          <p style="margin: 0 0 10px; color: #0c5460; font-size: 14px;">
            ${
              refundData.paymentMethod.toLowerCase().includes("cash") ||
              refundData.paymentMethod.toLowerCase().includes("cod")
                ? "Since this was a Cash on Delivery order, no refund processing is required."
                : `Your refund has been initiated and will be processed within 5-7 business days. The amount will be credited back to your original payment method.`
            }
          </p>
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            <strong>Expected Completion:</strong> ${expectedCompletion}
          </p>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #856404;">📞 Need Help?</h3>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            If you have any questions about your refund or don't see the amount credited after the expected timeframe, 
            please contact our customer support team with your refund ID.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/profile" 
             style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block; 
                    font-weight: bold;">
            View Order History
          </a>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate("Refund Initiated", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: refundData.userEmail,
    subject: `Refund Initiated - ${refundData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Refund initiated email sent to ${refundData.userEmail} for order ${refundData.orderId}`
  );
};

/**
 * Send refund processed (completed) email to customer
 */
export const sendRefundProcessedEmail = async (
  refundData: RefundEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(refundData.orderDate);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${
          EMAIL_CONFIG.BRAND_COLORS.SUCCESS
        }; text-align: center; margin-top: 0;">
          ✅ Refund Processed
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          Great news! Your refund has been successfully processed and the amount has been credited.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${
    refundData.orderId
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
              <strong style="color: #333;">Refunded Amount:</strong> 
              <span style="color: ${
                EMAIL_CONFIG.BRAND_COLORS.SUCCESS
              }; font-weight: bold; font-size: 18px;">₹${
    refundData.refundAmount
  }</span>
            </td>
          </tr>
          ${
            refundData.refundId
              ? `
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Refund ID:</strong> 
              <span style="font-family: monospace; background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${refundData.refundId}</span>
            </td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Credited to:</strong> 
              <span>${refundData.paymentMethod}</span>
            </td>
          </tr>
          ${
            refundData.refundProcessingTime
              ? `
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Processing Time:</strong> 
              <span>${refundData.refundProcessingTime}</span>
            </td>
          </tr>
          `
              : ""
          }
        </table>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #155724;">🎉 Refund Complete!</h3>
          <p style="margin: 0; color: #155724; font-size: 14px;">
            The refund amount has been successfully processed. Depending on your bank or payment provider, 
            it may take 1-2 additional business days to reflect in your account statement.
          </p>
        </div>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #333;">We Value Your Feedback</h3>
          <p style="margin: 0; color: #666; font-size: 14px;">
            We're sorry this order didn't work out, but we hope you'll give us another chance! 
            Browse our latest collection for amazing products from Gujarat.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/" 
             style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block; 
                    font-weight: bold;
                    margin-right: 10px;">
            Continue Shopping
          </a>
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/profile" 
             style="background-color: transparent; 
                    color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block; 
                    border: 2px solid ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">
            View Profile
          </a>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate("Refund Processed", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: refundData.userEmail,
    subject: `Refund Processed - ₹${refundData.refundAmount} Credited - ${refundData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Refund processed email sent to ${refundData.userEmail} for order ${refundData.orderId}`
  );
};

/**
 * Send refund failed email to customer
 */
export const sendRefundFailedEmail = async (
  refundData: RefundEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(refundData.orderDate);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #e74c3c; text-align: center; margin-top: 0;">
          ⚠️ Refund Processing Issue
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          We encountered an issue processing your refund automatically. Our team is working to resolve this.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${refundData.orderId}</span>
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
              <strong style="color: #333;">Refund Amount:</strong> 
              <span style="font-weight: bold;">₹${refundData.refundAmount}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment Method:</strong> 
              <span>${refundData.paymentMethod}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #856404;">🔄 Manual Processing</h3>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            Don't worry! Our team has been notified and will manually process your refund within 2-3 business days. 
            You'll receive another email once the refund is successfully processed.
          </p>
        </div>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #721c24;">📞 Need Immediate Assistance?</h3>
          <p style="margin: 0; color: #721c24; font-size: 14px;">
            If you have any urgent concerns about this refund, please contact our customer support team immediately. 
            Reference your Order ID: <strong>${refundData.orderId}</strong>
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/contact-us" 
             style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block; 
                    font-weight: bold;">
            Contact Support
          </a>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate("Refund Processing Issue", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: refundData.userEmail,
    subject: `Refund Processing Issue - ${refundData.orderId} - Manual Review Required`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Refund failed email sent to ${refundData.userEmail} for order ${refundData.orderId}`
  );
};

/**
 * Send refund under manual review email to customer
 */
export const sendRefundUnderReviewEmail = async (
  refundData: RefundEmailData
): Promise<void> => {
  const formattedDate = formatOrderDate(refundData.orderDate);

  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: #f39c12; text-align: center; margin-top: 0;">
          🔍 Refund Under Review
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666;">
          Your refund request is currently under manual review by our team.
        </p>

        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse; background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Order ID:</strong> 
              <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${refundData.orderId}</span>
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
              <strong style="color: #333;">Refund Amount:</strong> 
              <span style="font-weight: bold;">₹${refundData.refundAmount}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Payment Method:</strong> 
              <span>${refundData.paymentMethod}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px;">
              <strong style="color: #333;">Review Reason:</strong> 
              <span>${refundData.refundReason}</span>
            </td>
          </tr>
        </table>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #856404;">⏰ Review Timeline</h3>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            Our team will review your refund request within 2-3 business days. This review ensures that all 
            refund processing complies with our policies and payment provider requirements.
          </p>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">📧 We'll Keep You Updated</h3>
          <p style="margin: 0; color: #0c5460; font-size: 14px;">
            You'll receive an email notification as soon as the review is complete and your refund is processed. 
            No further action is required from your side.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/profile" 
             style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block; 
                    font-weight: bold;">
            Check Order Status
          </a>
        </div>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate("Refund Under Review", content);

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: refundData.userEmail,
    subject: `Refund Under Review - ${refundData.orderId}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Refund under review email sent to ${refundData.userEmail} for order ${refundData.orderId}`
  );
};
