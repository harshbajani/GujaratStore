import { transporter, EMAIL_CONFIG } from "../shared/config";
import { WelcomeEmailData } from "../shared/types";
import { wrapEmailTemplate } from "../shared/templates";

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (
  userData: WelcomeEmailData
): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; text-align: center; margin-top: 0;">
          🎉 Welcome to ${EMAIL_CONFIG.COMPANY_NAME}!
        </h1>
        
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center; color: #333; font-weight: 500;">
          Hello ${userData.name}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666; line-height: 1.6;">
          Thank you for joining our Gujarat Store family! We're thrilled to have you with us 
          and excited to help you discover the rich cultural heritage of Gujarat through our 
          authentic products.
        </p>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.SECONDARY}; color: white; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: white; font-size: 20px;">What makes us special?</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">🏺</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Authentic Products</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Handpicked traditional items</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">🚚</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Fast Delivery</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Quick shipping across India</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">💯</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Quality Assured</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Premium quality guarantee</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">🤝</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Great Support</h4>
              <p style="margin: 0; color: white; font-size: 12px;">24/7 customer assistance</p>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <h3 style="margin: 0 0 20px; color: #333;">Ready to start shopping?</h3>
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/products" 
             style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px;">
            Browse Products
          </a>
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/categories" 
             style="display: inline-block; background-color: transparent; color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; padding: 15px 40px; text-decoration: none; border: 2px solid ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px;">
            View Categories
          </a>
        </div>

        <div style="background-color: #e8f5e8; border: 1px solid #4CAF50; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #2e7d32;">🎁 Special Welcome Offer</h3>
          <p style="margin: 0; color: #2e7d32; font-size: 14px;">
            As a welcome gift, enjoy <strong>10% off</strong> on your first order! 
            Use code <strong style="background-color: #c8e6c9; padding: 3px 8px; border-radius: 4px;">WELCOME10</strong> 
            at checkout. Valid for 30 days.
          </p>
        </div>

        <div style="border-top: 2px solid ${EMAIL_CONFIG.BRAND_COLORS.SECONDARY}; padding-top: 30px; margin-top: 40px;">
          <h3 style="margin: 0 0 15px; color: #333; text-align: center;">Connect with us</h3>
          <div style="text-align: center;">
            <p style="margin: 0 0 10px; color: #666; font-size: 14px;">
              Follow us on social media for updates, offers, and cultural insights!
            </p>
            <div style="margin: 15px 0;">
              <a href="#" style="display: inline-block; margin: 0 10px; padding: 8px 15px; background-color: #f0f0f0; color: #333; text-decoration: none; border-radius: 4px; font-size: 12px;">Facebook</a>
              <a href="#" style="display: inline-block; margin: 0 10px; padding: 8px 15px; background-color: #f0f0f0; color: #333; text-decoration: none; border-radius: 4px; font-size: 12px;">Instagram</a>
              <a href="#" style="display: inline-block; margin: 0 10px; padding: 8px 15px; background-color: #f0f0f0; color: #333; text-decoration: none; border-radius: 4px; font-size: 12px;">Twitter</a>
            </div>
          </div>
        </div>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #333;">Need Help Getting Started?</h3>
          <p style="margin: 0 0 15px; color: #666; font-size: 14px;">
            Our customer support team is here to help you with any questions about our products or services.
          </p>
          <p style="margin: 0; color: #666; font-size: 14px;">
            📞 Call us: <strong>${EMAIL_CONFIG.SUPPORT_PHONE}</strong><br>
            ✉️ Email us: <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>
          </p>
        </div>

        <p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px; font-style: italic;">
          Thank you for choosing ${EMAIL_CONFIG.COMPANY_NAME}. We look forward to serving you!
        </p>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    `Welcome to ${EMAIL_CONFIG.COMPANY_NAME}`,
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: userData.email,
    subject: `Welcome to ${EMAIL_CONFIG.COMPANY_NAME} - Let's Get Started! 🎉`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Welcome email sent to ${userData.email}`);
};

/**
 * Send temporary password email to guest users
 */
export const sendTemporaryPasswordEmail = async (
  userData: WelcomeEmailData
): Promise<void> => {
  const content = `
    <tr>
      <td style="padding: 30px;">
        <h1 style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; text-align: center; margin-top: 0;">
          🔐 Your Account Credentials
        </h1>
        
        <p style="font-size: 18px; margin-bottom: 20px; text-align: center; color: #333; font-weight: 500;">
          Hello ${userData.name}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px; text-align: center; color: #666; line-height: 1.6;">
          Thank you for choosing to checkout as a guest! We've created an account for you 
          so you can track your order and access your purchase history.
        </p>

        <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: #856404; font-size: 20px;">🔑 Your Login Credentials</h2>
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 15px 0;">
            <p style="margin: 0 0 10px; color: #333; font-size: 14px;"><strong>Email:</strong> ${userData.email}</p>
            <p style="margin: 0; color: #333; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${userData.password}</code></p>
          </div>
          <p style="margin: 15px 0 0; color: #856404; font-size: 14px; font-weight: 500;">
            ⚠️ Please save this password securely and change it after your first login
          </p>
        </div>

        <div style="background-color: ${EMAIL_CONFIG.BRAND_COLORS.SECONDARY}; color: white; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
          <h2 style="margin: 0 0 15px; color: white; font-size: 20px;">What's Next?</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">🛒</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Complete Checkout</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Finish your purchase</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">📦</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Track Order</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Monitor delivery status</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">👤</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Manage Account</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Update profile & settings</p>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 8px;">🔄</div>
              <h4 style="margin: 0 0 5px; color: white; font-size: 14px;">Future Orders</h4>
              <p style="margin: 0; color: white; font-size: 12px;">Easy reordering</p>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <h3 style="margin: 0 0 20px; color: #333;">Ready to complete your order?</h3>
          <a href="${EMAIL_CONFIG.APP_BASE_URL}/sign-in" 
             style="display: inline-block; background-color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px;">
            Sign In to Your Account
          </a>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <h3 style="margin: 0 0 10px; color: #0c5460;">🔒 Security Tips</h3>
          <ul style="margin: 0; color: #0c5460; font-size: 14px; padding-left: 20px;">
            <li>Change your password after first login</li>
            <li>Never share your login credentials</li>
            <li>Log out from shared devices</li>
            <li>Contact us if you notice any suspicious activity</li>
          </ul>
        </div>

        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 30px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #333;">Need Help?</h3>
          <p style="margin: 0 0 15px; color: #666; font-size: 14px;">
            Our customer support team is here to help you with any questions about your account or order.
          </p>
          <p style="margin: 0; color: #666; font-size: 14px;">
            📞 Call us: <strong>${EMAIL_CONFIG.SUPPORT_PHONE}</strong><br>
            ✉️ Email us: <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="color: ${EMAIL_CONFIG.BRAND_COLORS.PRIMARY};">${EMAIL_CONFIG.SUPPORT_EMAIL}</a>
          </p>
        </div>

        <p style="font-size: 14px; text-align: center; color: #666; margin-top: 40px; font-style: italic;">
          Thank you for choosing ${EMAIL_CONFIG.COMPANY_NAME}. We look forward to serving you!
        </p>
      </td>
    </tr>
  `;

  const htmlTemplate = wrapEmailTemplate(
    `Your Account Credentials - ${EMAIL_CONFIG.COMPANY_NAME}`,
    content
  );

  const mailOptions = {
    from: `"${EMAIL_CONFIG.COMPANY_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to: userData.email,
    subject: `Your Account Credentials - ${EMAIL_CONFIG.COMPANY_NAME} 🔐`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Temporary password email sent to ${userData.email}`);
};
