import { EMAIL_CONFIG, formatCurrency, getCurrentYear } from "./config";
import { OrderEmailData } from "./types";

/**
 * Generate the common email header with logo
 */
export const generateEmailHeader = (): string => {
  return `
    <tr>
      <td style="text-align: center; padding: 20px 0; background-color: ${EMAIL_CONFIG.BRAND_COLORS.SECONDARY}; color: white;">
        <img
          src="${EMAIL_CONFIG.LOGO_URL}"
          alt="${EMAIL_CONFIG.COMPANY_NAME} Logo"
          style="max-width: 150px; height: auto; display: block; margin: 0 auto;"
        />
      </td>
    </tr>
  `;
};

/**
 * Generate the common email footer
 */
export const generateEmailFooter = (): string => {
  return `
    <tr>
      <td style="background-color: ${
        EMAIL_CONFIG.BRAND_COLORS.SECONDARY
      }; padding: 20px 30px; text-align: center;">
        <p style="margin: 0; color: white; font-size: 14px;">© ${getCurrentYear()} ${
    EMAIL_CONFIG.COMPANY_NAME
  }. All rights reserved.</p>
        <p style="margin: 10px 0 0; color: white; font-size: 12px;">Experience the richness of Gujarat's cultural heritage</p>
      </td>
    </tr>
  `;
};

/**
 * Generate the "Need Help" section
 */
export const generateHelpSection = (): string => {
  return `
    <tr>
      <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
        <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Need Help?</h3>
        <p style="margin: 0; color: #666; font-size: 14px;">
          If you have any questions, please contact our customer support at 
          <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${EMAIL_CONFIG.SUPPORT_EMAIL}</a> 
          or call us at <strong>${EMAIL_CONFIG.SUPPORT_PHONE}</strong>.
        </p>
      </td>
    </tr>
  `;
};

/**
 * Generate items HTML table for orders
 */
export const generateOrderItemsHTML = (
  items: OrderEmailData["items"]
): string => {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <div style="width: 60px; margin-right: 15px;">
            <img src="${
              EMAIL_CONFIG.APP_BASE_URL
            }/_next/image?url=%2Fapi%2Ffiles%2F${
        item.coverImage
      }&w=256&q=75" alt="${
        item.productName
      }" style="width:60px; border-radius:4px;" />
          </div>
          <div>
            <p style="margin: 0; font-weight: bold;">${item.productName}</p>
            ${
              item.selectedSize
                ? `<p style="margin: 3px 0 0; color: #666; font-size: 14px;">Size: ${item.selectedSize}</p>`
                : ""
            }
            <p style="margin: 3px 0 0; color: #666; font-size: 14px;">Quantity: ${
              item.quantity
            }</p>
            <p style="margin: 3px 0 0; color: #666; font-size: 14px;">Delivery by: ${
              item.deliveryDate
            }</p>
          </div>
        </div>
      </td>
      <td style="padding: 15px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
        <p style="margin: 0; font-weight: bold;">${formatCurrency(
          item.price * item.quantity
        )}</p>
      </td>
    </tr>
  `
    )
    .join("");
};

/**
 * Generate order totals section
 */
export const generateOrderTotalsHTML = (orderData: OrderEmailData): string => {
  return `
    <table style="width: 100%; margin: 15px 0 30px; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666;">Subtotal</td>
        <td style="padding: 8px 0; text-align: right;">${formatCurrency(
          orderData.subtotal
        )}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Delivery Charges</td>
        <td style="padding: 8px 0; text-align: right;">
          ${
            orderData.deliveryCharges > 0
              ? formatCurrency(orderData.deliveryCharges)
              : '<span style="color: #4CAF50;">Free</span>'
          }
        </td>
      </tr>
      ${
        orderData.discountAmount
          ? `
      <tr>
        <td style="padding: 8px 0; color: #4CAF50;">Discount</td>
        <td style="padding: 8px 0; text-align: right; color: #4CAF50;">-${formatCurrency(
          orderData.discountAmount
        )}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding: 12px 0; font-weight: bold; font-size: 18px; border-top: 1px solid #eee;">Total</td>
        <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; border-top: 1px solid #eee;">${formatCurrency(
          orderData.total
        )}</td>
      </tr>
    </table>
  `;
};

/**
 * Generate order info section
 */
export const generateOrderInfoHTML = (
  orderData: OrderEmailData,
  formattedDate: string
): string => {
  return `
    <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
      <tr>
        <td style="padding-bottom: 8px;">
          <strong style="color: #333;">Order ID:</strong> 
          <span style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${
    orderData.orderId
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
          <strong style="color: #333;">Payment Method:</strong> 
          <span>${
            orderData.paymentOption === "cash-on-delivery"
              ? "Cash on Delivery"
              : orderData.paymentOption
          }</span>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Generate delivery address section
 */
export const generateDeliveryAddressHTML = (
  address: OrderEmailData["address"]
): string => {
  return `
    <tr>
      <td style="padding: 0 30px 30px;">
        <h2 style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; border-bottom: 2px solid ${EMAIL_CONFIG.BRAND_COLORS.SECONDARY}; padding-bottom: 10px; margin-top: 0;">Delivery Address</h2>
        <div style="background-color: #f9f9f9; border-radius: 6px; padding: 15px; margin-top: 10px;">
          <p style="margin: 0 0 5px; font-weight: bold;">${address.name}</p>
          <p style="margin: 0 0 5px;">${address.contact}</p>
          <p style="margin: 0 0 5px;">${address.address_line_1}</p>
          <p style="margin: 0 0 5px;">${address.address_line_2}</p>
          <p style="margin: 0 0 5px;">${address.locality}, ${address.state} - ${address.pincode}</p>
          <p style="margin: 10px 0 0; display: inline-block; background-color: #eee; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${address.type}</p>
        </div>
      </td>
    </tr>
  `;
};

/**
 * Generate base email template wrapper
 */
export const wrapEmailTemplate = (title: string, content: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - ${EMAIL_CONFIG.COMPANY_NAME}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${generateEmailHeader()}
                ${content}
                ${generateHelpSection()}
                ${generateEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
