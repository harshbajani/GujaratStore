// File: lib/emails.ts
import nodemailer from "nodemailer";
import { format } from "date-fns";

type OrderEmailData = Pick<
  IOrder,
  | "orderId"
  | "items"
  | "subtotal"
  | "deliveryCharges"
  | "total"
  | "createdAt"
  | "paymentOption"
  | "discountAmount"
> & {
  userName: string;
  userEmail: string;
  recipientType?: "user" | "vendor" | "admin";
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
  cancellationReason?: string;
  vendorId?: string;
};

interface WelcomeEmailData {
  email: string;
  name: string;
  password: string;
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

  const getGreeting = (recipientType: string, name?: string) => {
    switch (recipientType) {
      case "vendor":
        return "Dear Vendor,";
      case "admin":
        return "Dear Admin,";
      default:
        return `Dear ${name},`;
    }
  };

  const getIntroText = (recipientType: string) => {
    switch (recipientType) {
      case "vendor":
        return "You have received a new order for your products. Here are the order details:";
      case "admin":
        return "A new order has been placed on The Gujarat Store. Here are the order details:";
      default:
        return "Thank you for your order! We're pleased to confirm that your order has been received and is being processed.";
    }
  };

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
                    <p style="margin: 0 0 15px; color: #333; font-size: 16px;">${getGreeting(
                      orderData.recipientType || "user",
                      orderData.userName
                    )}</p>
                    <p style="margin: 0 0 25px; color: #333; font-size: 16px;">${getIntroText(
                      orderData.recipientType || "user"
                    )}</p>
                    
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
                      <a href="mailto:contact@thegujaratstore.com" style="color: #C93326;">contact@thegujaratstore.com</a> 
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

export const sendOrderCancellationEmail = async (orderData: OrderEmailData) => {
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

  // Generate items HTML (reusing the same format as order confirmation)
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
        <title>Order Cancellation - The Gujarat Store</title>
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
                    <h1 style="margin: 0 0 20px; color: #C93326; text-align: center; font-size: 24px;">Order Cancellation Confirmation</h1>
                    <p style="margin: 0 0 15px; color: #333; font-size: 16px;">Dear ${
                      orderData.userName
                    },</p>
                    <p style="margin: 0 0 25px; color: #333; font-size: 16px;">We have received your request to cancel your order. Your order has been successfully cancelled. Here are the details:</p>
                    
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
                    <h2 style="color: #C93326; border-bottom: 2px solid #FA7275; padding-bottom: 10px; margin-top: 0;">Cancelled Order Summary</h2>
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

                <!-- Refund Information -->
                <tr>
                  <td style="padding: 0 30px 30px;">
                    <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-top: 10px;">
                      <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">Refund Information</h3>
                      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                        If you have already made the payment, the refund will be processed within 5-7 business days to your original payment method.
                      </p>
                      <p style="margin: 0; color: #666; font-size: 14px;">
                        For any questions regarding your refund, please contact our customer support.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Need Help -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                    <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Need Help?</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      If you have any questions about your order cancellation, please contact our customer support at 
                      <a href="mailto:contact@thegujaratstore.com" style="color: #C93326;">contact@thegujaratstore.com</a> 
                      or call us at <strong>+91-1234567890</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const mailOptions = {
    from: `"The Gujarat Store" <${process.env.SMTP_USER}>`,
    to: orderData.userEmail,
    subject: `Order Cancellation Confirmation - Order #${orderData.orderId}`,
    html: emailTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendVendorCancellationEmail = async (
  orderData: OrderEmailData & { cancellationReason: string }
) => {
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

  // Generate items HTML (reusing the same format as order confirmation)
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
        <title>Order Cancellation - The Gujarat Store</title>
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
                    <h1 style="margin: 0 0 20px; color: #C93326; text-align: center; font-size: 24px;">Order Cancellation Notice</h1>
                    <p style="margin: 0 0 15px; color: #333; font-size: 16px;">Dear ${
                      orderData.userName
                    },</p>
                    <p style="margin: 0 0 25px; color: #333; font-size: 16px;">We regret to inform you that your order has been cancelled by the vendor. Here are the details:</p>
                    
                    <!-- Cancellation Reason -->
                    <div style="background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                      <h3 style="margin: 0 0 10px; color: #856404; font-size: 16px;">Cancellation Reason:</h3>
                      <p style="margin: 0; color: #856404; font-size: 14px;">${
                        orderData.cancellationReason
                      }</p>
                    </div>
                    
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
                    <h2 style="color: #C93326; border-bottom: 2px solid #FA7275; padding-bottom: 10px; margin-top: 0;">Cancelled Order Summary</h2>
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

                <!-- Refund Information -->
                <tr>
                  <td style="padding: 0 30px 30px;">
                    <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-top: 10px;">
                      <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">Refund Information</h3>
                      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                        If you have already made the payment, the refund will be processed within 5-7 business days to your original payment method.
                      </p>
                      <p style="margin: 0; color: #666; font-size: 14px;">
                        For any questions regarding your refund, please contact our customer support.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Need Help -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                    <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Need Help?</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      If you have any questions about your order cancellation, please contact our customer support at 
                      <a href="mailto:contact@thegujaratstore.com" style="color: #C93326;">contact@thegujaratstore.com</a> 
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
    subject: `Order Cancellation Notice - #${orderData.orderId} - The Gujarat Store`,
    html: emailTemplate,
  });
};

export const sendAdminCancellationEmail = async (
  orderData: OrderEmailData & { cancellationReason: string }
) => {
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

  // Generate items HTML (reusing the same format as order confirmation)
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
        <title>Order Cancellation - The Gujarat Store</title>
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
                    <h1 style="margin: 0 0 20px; color: #C93326; text-align: center; font-size: 24px;">Order Cancellation Notice</h1>
                    <p style="margin: 0 0 15px; color: #333; font-size: 16px;">Dear ${
                      orderData.userName
                    },</p>
                    <p style="margin: 0 0 25px; color: #333; font-size: 16px;">We regret to inform you that your order has been cancelled by <strong>The Gujarat Store</strong>. Here are the details:</p>
                    
                    <!-- Cancellation Reason -->
                    <div style="background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
                      <h3 style="margin: 0 0 10px; color: #856404; font-size: 16px;">Cancellation Reason:</h3>
                      <p style="margin: 0; color: #856404; font-size: 14px;">${
                        orderData.cancellationReason
                      }</p>
                    </div>
                    
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
                    <h2 style="color: #C93326; border-bottom: 2px solid #FA7275; padding-bottom: 10px; margin-top: 0;">Cancelled Order Summary</h2>
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

                <!-- Refund Information -->
                <tr>
                  <td style="padding: 0 30px 30px;">
                    <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin-top: 10px;">
                      <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">Refund Information</h3>
                      <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
                        If you have already made the payment, the refund will be processed within 5-7 business days to your original payment method.
                      </p>
                      <p style="margin: 0; color: #666; font-size: 14px;">
                        For any questions regarding your refund, please contact our customer support.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Need Help -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
                    <h3 style="margin: 0 0 10px; color: #333; font-size: 16px;">Need Help?</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      If you have any questions about your order cancellation, please contact our customer support at 
                      <a href="mailto:contact@thegujaratstore.com" style="color: #C93326;">contact@thegujaratstore.com</a> 
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
    subject: `Order Cancellation Notice - #${orderData.orderId} - The Gujarat Store`,
    html: emailTemplate,
  });
};

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { email, name, password } = data;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const emailTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Gujarat Store</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
          <h1 style="color: #C93326; text-align: center;">Welcome to Gujarat Store!</h1>
          <p>Dear ${name},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please keep these credentials safe and change your password after logging in.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to Gujarat Store - Your Account Details",
    html: emailTemplate,
  });
}
