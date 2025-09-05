import PolicyPageLayout from "@/components/PolicyPageLayout";

const PrivacyPolicy = () => {
  return (
    <PolicyPageLayout title="Privacy Policy">
      <div className="space-y-8">
        <div className="text-gray-600 text-sm mb-8">
          <p><strong>Last Updated:</strong> September 3, 2025</p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            THE GUJARAT STORE ("we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [thegujaratstore.com] and use our services. By using our website, you agree to the terms of this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
            <li>Personal identification information (Name, email address, phone number, shipping and billing address) when you register or place an order.</li>
            <li>Payment information to process transactions securely.</li>
            <li>Usage data such as IP address, browser type, and browsing behaviour collected through cookies and tracking technologies.</li>
            <li>Communication data from customer service interactions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
            <li>To process and fulfil your orders.</li>
            <li>To communicate order updates, promotions, and important announcements.</li>
            <li>To improve our website, products, and services.</li>
            <li>To detect and prevent fraudulent activities.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
          <p className="text-gray-700 leading-relaxed">
            We do not sell or rent your personal data. We may share information with trusted third-party service providers who assist in operating our website, processing payments, and delivering products, subject to confidentiality agreements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies and Tracking Technologies</h2>
          <p className="text-gray-700 leading-relaxed">
            We use cookies to enhance your browsing experience, analyze website traffic, and personalize content. You can modify cookie settings via your browser.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
          <p className="text-gray-700 leading-relaxed">
            You have the right to access, update, or delete your personal information. You may opt out of marketing communications at any time by following unsubscribe instructions or contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
          <p className="text-gray-700 leading-relaxed">
            We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy or as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Transfers</h2>
          <p className="text-gray-700 leading-relaxed">
            If you are located outside India, your data may be transferred to and processed in India or other countries where we operate, under appropriate safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> contact@thegujaratstore.com
            </p>
            <p className="text-gray-700">
              <strong>Address:</strong> Proactii Media LLP<br />
              206-A, Platinum Commercial Center,<br />
              Opp VIA Ground, GIDC Vapi 396195
            </p>
          </div>
        </section>
      </div>
    </PolicyPageLayout>
  );
};

export default PrivacyPolicy;
