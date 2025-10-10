import { transporter, EMAIL_CONFIG } from '../shared/config';
import { wrapEmailTemplate } from '../shared/templates';

// Email data interface for shipping notifications
export interface ShippingEmailData {
  orderId: string;
  userName: string;
  userEmail: string;
  trackingNumber: string;
  courierName: string;
  currentStatus: string;
  systemStatus: string;
  estimatedDelivery?: string | null;
  trackingUrl: string;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
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
  trackingHistory?: Array<{
    status: string;
    activity: string;
    location: string;
    date: Date;
  }>;
}

/**
 * Send shipping notification email based on notification type
 */
export const sendShippingNotificationEmail = async (
  notificationType: string,
  emailData: ShippingEmailData
): Promise<void> => {
  switch (notificationType) {
    case 'shipped':
      await sendOrderShippedEmail(emailData);
      break;
    case 'in_transit':
      await sendOrderInTransitEmail(emailData);
      break;
    case 'out_for_delivery':
      await sendOrderOutForDeliveryEmail(emailData);
      break;
    case 'delivered':
      await sendOrderDeliveredEmail(emailData);
      break;
    default:
      console.log(`No email template for notification type: ${notificationType}`);
  }
};

/**
 * Send order shipped email
 */
export const sendOrderShippedEmail = async (
  emailData: ShippingEmailData
): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; text-align: center; margin-top: 0;">
          🚚 Your Order is on its Way!
        </h1>
        
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center; color: #333; font-weight: 500;">
          Hello ${emailData.userName}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666; line-height: 1.6;">
          Great news! Your order <strong>#${emailData.orderId}</strong> has been shipped and is on its way to you.
        </p>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.SUCCESS}; color: white; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: white; font-size: 20px;">📦 Shipping Details</h2>
          <div style="background-color: rgba(255,255,255,0.1); border-radius: 6px; padding: 20px; margin: 15px 0;">
            <p style="margin: 0 0 10px; color: white; font-size: 16px;"><strong>Tracking Number:</strong> ${emailData.trackingNumber}</p>
            <p style="margin: 0 0 10px; color: white; font-size: 16px;"><strong>Courier:</strong> ${emailData.courierName}</p>
            ${emailData.estimatedDelivery ? `<p style="margin: 0; color: white; font-size: 16px;"><strong>Expected Delivery:</strong> ${emailData.estimatedDelivery}</p>` : ''}
          </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${emailData.trackingUrl}" 
             style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px;">
            Track Your Package
          </a>
        </div>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 15px; color: #333;">📍 Delivery Address</h3>
          <p style="margin: 0; color: #666; line-height: 1.6;">
            ${emailData.address.name}<br>
            ${emailData.address.address_line_1}<br>
            ${emailData.address.address_line_2 ? `${emailData.address.address_line_2}<br>` : ''}
            ${emailData.address.locality}, ${emailData.address.state} - ${emailData.address.pincode}
          </p>
        </div>

        <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">💡 What's Next?</h3>
          <ul style="margin: 0; color: #0c5460; font-size: 14px; padding-left: 20px;">
            <li>Keep your tracking number handy for easy updates</li>
            <li>You'll receive notifications when your package is out for delivery</li>
            <li>Make sure someone is available to receive the package</li>
            <li>Contact us if you have any questions or concerns</li>
          </ul>
        </div>

        <p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px;">
          Thank you for shopping with ${EMAIL_CONFIG.COMPANY_NAME}!
        </p>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    `Your Order #${emailData.orderId} is Shipped!`,
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: emailData.userEmail,
    subject: `📦 Your Order #${emailData.orderId} is on its Way!`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Order shipped email sent to ${emailData.userEmail}`);
};

/**
 * Send order in transit email
 */
export const sendOrderInTransitEmail = async (
  emailData: ShippingEmailData
): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; text-align: center; margin-top: 0;">
          🚛 Your Order is in Transit
        </h1>
        
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center; color: #333; font-weight: 500;">
          Hello ${emailData.userName}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666; line-height: 1.6;">
          Your order <strong>#${emailData.orderId}</strong> is currently in transit and moving towards its destination.
        </p>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.WARNING}; color: white; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: white; font-size: 20px;">🚛 Transit Update</h2>
          <p style="margin: 0; color: white; font-size: 16px;">
            Your package is currently moving through our courier network and will reach you soon!
          </p>
          ${emailData.estimatedDelivery ? `<p style="margin: 15px 0 0; color: white; font-size: 14px;"><strong>Expected Delivery:</strong> ${emailData.estimatedDelivery}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${emailData.trackingUrl}" 
             style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Track Your Package
          </a>
        </div>

        <p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px;">
          We'll notify you when your package is out for delivery!
        </p>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    `Order #${emailData.orderId} is in Transit`,
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: emailData.userEmail,
    subject: `🚛 Order #${emailData.orderId} is in Transit`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Order in transit email sent to ${emailData.userEmail}`);
};

/**
 * Send order out for delivery email
 */
export const sendOrderOutForDeliveryEmail = async (
  emailData: ShippingEmailData
): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; text-align: center; margin-top: 0;">
          🚚 Your Order is Out for Delivery!
        </h1>
        
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center; color: #333; font-weight: 500;">
          Hello ${emailData.userName}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666; line-height: 1.6;">
          Exciting news! Your order <strong>#${emailData.orderId}</strong> is out for delivery and should reach you today!
        </p>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.WARNING}; color: white; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: white; font-size: 20px;">🚚 Out for Delivery</h2>
          <p style="margin: 0; color: white; font-size: 16px;">
            Your package is with our delivery partner <strong>${emailData.courierName}</strong> and is on its way to you!
          </p>
          <p style="margin: 15px 0 0; color: white; font-size: 14px;">
            <strong>Tracking Number:</strong> ${emailData.trackingNumber}
          </p>
        </div>

        <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 15px; color: #856404; text-align: center;">📍 Please Be Available</h3>
          <p style="margin: 0 0 10px; color: #856404; font-size: 14px;">
            <strong>Delivery Address:</strong><br>
            ${emailData.address.name}<br>
            ${emailData.address.address_line_1}<br>
            ${emailData.address.address_line_2 ? `${emailData.address.address_line_2}<br>` : ''}
            ${emailData.address.locality}, ${emailData.address.state} - ${emailData.address.pincode}
          </p>
          <p style="margin: 15px 0 0; color: #856404; font-size: 14px;">
            Please ensure someone is available to receive the package. The delivery executive may call you on <strong>${emailData.address.contact}</strong>
          </p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${emailData.trackingUrl}" 
             style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Track Live Location
          </a>
        </div>

        <p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px;">
          Thank you for your patience. We hope you love your purchase!
        </p>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    `Order #${emailData.orderId} is Out for Delivery!`,
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: emailData.userEmail,
    subject: `🚚 Order #${emailData.orderId} is Out for Delivery!`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Order out for delivery email sent to ${emailData.userEmail}`);
};

/**
 * Send order delivered email
 */
export const sendOrderDeliveredEmail = async (
  emailData: ShippingEmailData
): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${EMAIL_CONFIG.BRAND_COLORS.SUCCESS}; text-align: center; margin-top: 0;">
          🎉 Your Order Has Been Delivered!
        </h1>
        
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center; color: #333; font-weight: 500;">
          Hello ${emailData.userName}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666; line-height: 1.6;">
          Great news! Your order <strong>#${emailData.orderId}</strong> has been successfully delivered.
        </p>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.SUCCESS}; color: white; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: white; font-size: 20px;">✅ Delivery Confirmed</h2>
          <p style="margin: 0; color: white; font-size: 16px;">
            Your package was delivered by <strong>${emailData.courierName}</strong>
          </p>
          <p style="margin: 15px 0 0; color: white; font-size: 14px;">
            <strong>Tracking Number:</strong> ${emailData.trackingNumber}
          </p>
        </div>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 15px; color: #333; text-align: center;">📦 Order Summary</h3>
          ${emailData.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p style="margin: 0; color: #333; font-weight: 500;">${item.productName}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">Quantity: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</p>
            </div>
          `).join('')}
          <div style="padding: 15px 0 0; text-align: right;">
            <p style="margin: 0; color: #333; font-weight: bold; font-size: 18px;">
              Total: ₹${emailData.total.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 15px; color: #2e7d32;">💚 We Hope You Love It!</h3>
          <p style="margin: 0 0 15px; color: #2e7d32; font-size: 14px;">
            Thank you for choosing ${EMAIL_CONFIG.COMPANY_NAME}. We'd love to hear about your experience!
          </p>
          <div style="margin: 20px 0;">
            <a href="${EMAIL_CONFIG.APP_BASE_URL}/orders" 
               style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.SUCCESS}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; margin: 5px;">
              View Order Details
            </a>
            <a href="${EMAIL_CONFIG.APP_BASE_URL}/products" 
               style="display: inline-block; background-color: transparent; color: ${EMAIL_CONFIG.BRAND_COLORS.SUCCESS}; padding: 12px 30px; text-decoration: none; border: 2px solid ${EMAIL_CONFIG.BRAND_COLORS.SUCCESS}; border-radius: 6px; font-weight: bold; font-size: 14px; margin: 5px;">
              Shop Again
            </a>
          </div>
        </div>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #333;">Need Help?</h3>
          <p style="margin: 0 0 15px; color: #666; font-size: 14px;">
            If you have any issues with your order or need assistance, we're here to help!
          </p>
          <p style="margin: 0; color: #666; font-size: 14px;">
            📞 Call us: <strong>${EMAIL_CONFIG.SUPPORT_PHONE}</strong><br>
            ✉️ Email us: <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>
          </p>
        </div>

        <p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px; font-style: italic;">
          Thank you for being a valued customer of ${EMAIL_CONFIG.COMPANY_NAME}!
        </p>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    `Order #${emailData.orderId} Delivered Successfully!`,
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: emailData.userEmail,
    subject: `🎉 Your Order #${emailData.orderId} Has Been Delivered!`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Order delivered email sent to ${emailData.userEmail}`);
};
