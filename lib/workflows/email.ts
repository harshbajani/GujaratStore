// File: lib/emails.ts
import nodemailer from "nodemailer";
import { format } from "date-fns";

interface OrderItem {
  productId: string;
  productName: string;
  coverImage: string;
  price: number;
  quantity: number;
  deliveryDate: string;
  selectedSize?: string;
}

interface Address {
  _id: string;
  name: string;
  contact: string;
  address_line_1: string;
  address_line_2: string;
  locality: string;
  state: string;
  pincode: string;
  type: string;
}

interface OrderEmailData {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  discountAmount?: number;
  total: number;
  paymentOption: string;
  createdAt: string;
  address: Address;
  userName: string;
  userEmail: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderEmailData) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const formattedDate = format(
    new Date(orderData.createdAt),
    "d MMM yyyy, h:mm a"
  );

  // Generate items HTML
  const itemsHTML = orderData.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <div style="width: 60px; margin-right: 15px;">
            <img src="${process.env
              .NEXT_PUBLIC_APP_BASE_URL!}/_next/image?url=%2Fapi%2Ffiles%2F${
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
        <p style="margin: 0; font-weight: bold;">₹${(
          item.price * item.quantity
        ).toLocaleString("en-IN")}</p>
      </td>
    </tr>
  `
    )
    .join("");

  const emailTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - The Gujarat Store</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with Logo -->
                <tr>
                  <td style="text-align: center; padding: 20px 0; background-color: #FA7275;">
                    <img
                      src="https://gujarat-store.vercel.app/_next/image?url=%2Flogo.png&w=128&q=75"
                      alt="The Gujarat Store Logo"
                      style="max-width: 150px; height: auto; display: block; margin: 0 auto;"
                    />
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px 30px 10px;">
                    <h1 style="margin: 0 0 20px; color: #C93326; text-align: center; font-size: 24px;">Order Confirmation</h1>
                    <p style="margin: 0 0 15px; color: #333; font-size: 16px;">Dear ${
                      orderData.userName
                    },</p>
                    <p style="margin: 0 0 25px; color: #333; font-size: 16px;">Thank you for your order! We're pleased to confirm that your order has been received and is being processed.</p>
                    
                    <!-- Order Info -->
                    <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <strong style="color: #333;">Order ID:</strong> 
                          <span style="color: #C93326;">${
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
                  </td>
                </tr>

                <!-- Order Summary -->
                <tr>
                  <td style="padding: 0 30px;">
                    <h2 style="color: #C93326; border-bottom: 2px solid #FA7275; padding-bottom: 10px; margin-top: 0;">Order Summary</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      ${itemsHTML}
                    </table>
                    
                    <!-- Order Totals -->
                    <table style="width: 100%; margin: 15px 0 30px; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666;">Subtotal</td>
                        <td style="padding: 8px 0; text-align: right;">₹${orderData.subtotal.toLocaleString(
                          "en-IN"
                        )}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666;">Delivery Charges</td>
                        <td style="padding: 8px 0; text-align: right;">
                          ${
                            orderData.deliveryCharges > 0
                              ? `₹${orderData.deliveryCharges.toLocaleString(
                                  "en-IN"
                                )}`
                              : '<span style="color: #4CAF50;">Free</span>'
                          }
                        </td>
                      </tr>
                      ${
                        orderData.discountAmount
                          ? `
                      <tr>
                        <td style="padding: 8px 0; color: #4CAF50;">Discount</td>
                        <td style="padding: 8px 0; text-align: right; color: #4CAF50;">-₹${orderData.discountAmount.toLocaleString(
                          "en-IN"
                        )}</td>
                      </tr>
                      `
                          : ""
                      }
                      <tr>
                        <td style="padding: 12px 0; font-weight: bold; font-size: 18px; border-top: 1px solid #eee;">Total</td>
                        <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; border-top: 1px solid #eee;">₹${orderData.total.toLocaleString(
                          "en-IN"
                        )}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Delivery Address -->
                <tr>
                  <td style="padding: 0 30px 30px;">
                    <h2 style="color: #C93326; border-bottom: 2px solid #FA7275; padding-bottom: 10px; margin-top: 0;">Delivery Address</h2>
                    <div style="background-color: #f9f9f9; border-radius: 6px; padding: 15px; margin-top: 10px;">
                      <p style="margin: 0 0 5px; font-weight: bold;">${
                        orderData.address.name
                      }</p>
                      <p style="margin: 0 0 5px;">${
                        orderData.address.contact
                      }</p>
                      <p style="margin: 0 0 5px;">${
                        orderData.address.address_line_1
                      }</p>
                      <p style="margin: 0 0 5px;">${
                        orderData.address.address_line_2
                      }</p>
                      <p style="margin: 0 0 5px;">${
                        orderData.address.locality
                      }, ${orderData.address.state} - ${
    orderData.address.pincode
  }</p>
                      <p style="margin: 10px 0 0; display: inline-block; background-color: #eee; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${
                        orderData.address.type
                      }</p>
                    </div>
                  </td>
                </tr>

                <!-- Order Tracking Link -->
                <tr>
                  <td style="padding: 0 30px 30px; text-align: center;">
                    <a href="${
                      process.env.NEXT_PUBLIC_APP_BASE_URL
                    }/order-summary/${
    orderData.orderId
  }" style="display: inline-block; background-color: #C93326; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold;">
                      Track Your Order
                    </a>
                    <p style="margin: 15px 0 0; color: #666; font-size: 14px;">
                      You can view your order status anytime by clicking the link above.
                    </p>
                  </td>
                </tr>
                
                <!-- Need Help -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                    <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Need Help?</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      If you have any questions about your order, please contact our customer support at 
                      <a href="mailto:support@thegujaratstore.com" style="color: #C93326;">support@thegujaratstore.com</a> 
                      or call us at <strong>+91-1234567890</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #FF7474; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; color: white; font-size: 14px;">© ${new Date().getFullYear()} The Gujarat Store. All rights reserved.</p>
                    <p style="margin: 10px 0 0; color: white; font-size: 12px;">Experience the richness of Gujarat's cultural heritage</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: orderData.userEmail,
    subject: `Order Confirmation - #${orderData.orderId} - The Gujarat Store`,
    html: emailTemplate,
  });
};
