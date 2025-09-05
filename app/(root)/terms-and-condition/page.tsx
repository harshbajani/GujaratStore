import PolicyPageLayout from "@/components/PolicyPageLayout";

const TermsAndCondition = () => {
  return (
    <PolicyPageLayout title="Terms & Conditions">
      <div className="space-y-8">
        <div className="text-gray-600 text-sm mb-8">
          <p>
            <strong>Last Updated:</strong> September 3, 2025
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Introduction
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Welcome to THE GUJARAT STORE. These Terms and Conditions ("Terms")
            govern your use of our website [thegujaratstore.com] and our
            services. By accessing or using our website, you agree to comply
            with these Terms. If you do not agree, please do not use our
            services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. Account Registration
          </h2>
          <p className="text-gray-700 leading-relaxed">
            To place orders or use certain features, you must create an account.
            You agree to provide accurate information and maintain the
            confidentiality of your account credentials. You are responsible for
            all activities conducted from your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. Product Information
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We strive to provide accurate descriptions and images of products.
            However, we do not guarantee that product descriptions, pricing, or
            other content is error-free.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Orders and Payments
          </h2>
          <p className="text-gray-700 leading-relaxed">
            When you place an order, you agree to provide current, complete, and
            accurate purchase and account information. We reserve the right to
            refuse or cancel any order at our discretion. Payments should be
            made through authorized payment methods.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. Shipping and Delivery
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We aim to deliver products within estimated timelines but do not
            guarantee delivery dates. Shipping costs and policies will be
            communicated at checkout.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Returns and Refunds
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Our return and refund policies apply as described on the website.
            Please review them carefully before making a purchase.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Intellectual Property
          </h2>
          <p className="text-gray-700 leading-relaxed">
            All content on this website, including images, text, logos, and
            designs, is the property of THE GUJARAT STORE or its licensors and
            is protected by intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. Prohibited Activities
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Users agree not to engage in unlawful acts, infringe on intellectual
            property, upload harmful content, or interfere with the website's
            operation.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            9. Limitation of Liability
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We are not liable for indirect, incidental, or consequential damages
            arising from the use of this website or products purchased.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            Use of your personal information is governed by our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            11. Changes to Terms
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We may update these Terms at any time. Changes are effective upon
            posting to the website. Continued use after updates constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            12. Governing Law
          </h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms shall be governed by and construed under the laws of
            India.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            13. Contact Us
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            For any questions regarding these Terms, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> contact@thegujaratstore.com
            </p>
            <p className="text-gray-700">
              <strong>Address:</strong> Proactii Media LLP
              <br />
              206-A, Platinum Commercial Center,
              <br />
              Opp VIA Ground, GIDC Vapi 396195
            </p>
          </div>
        </section>
      </div>
    </PolicyPageLayout>
  );
};

export default TermsAndCondition;
