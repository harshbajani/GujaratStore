import PolicyPageLayout from "@/components/PolicyPageLayout";

const ReturnPolicy = () => {
  return (
    <PolicyPageLayout title="Return Policy">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Return Window
          </h2>
          <p className="text-gray-700 leading-relaxed">
            If you are not satisfied with your purchase for any reason, you may
            return the product within <strong>30 days</strong> of the delivery
            date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. Eligibility
          </h2>
          <p className="text-gray-700 leading-relaxed">
            To be eligible for a return, items must be unused, in their original
            packaging, and with all original tags and labels attached. Products
            that are damaged, altered, or worn will not be accepted.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. Non-Returnable Items
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Certain products such as perishable goods (foods, organic items),
            final sale or discounted items, and beauty products (used or opened)
            are non-returnable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Return Process
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <ol className="list-decimal list-inside text-gray-700 space-y-3 leading-relaxed">
              <li>
                Contact our customer support with your order number and reason
                for return.
              </li>
              <li>We will provide a return shipping label and instructions.</li>
              <li>Pack the product securely in original packaging.</li>
              <li>
                Ship the package using the provided label within 7 days of
                receiving it.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Refunds</h2>
          <p className="text-gray-700 leading-relaxed">
            Once the returned item is received and inspected, we will notify you
            of the approval or rejection of your refund. Approved refunds will
            be processed back to your original payment method within{" "}
            <strong>7-14 business days</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Exchanges
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We offer exchanges for size or color variants if available. Please
            contact customer support for assistance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Shipping Costs
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Return shipping costs are generally the responsibility of the
            customer unless the return is due to our error (e.g., wrong or
            defective item).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            For any questions regarding returns, please reach out to:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              <a
                href="mailto:contact@thegujaratstore.com"
                className="text-brand hover:underline font-medium"
              >
                contact@thegujaratstore.com
              </a>
            </p>
          </div>
        </section>

        <section className="bg-brand/5 border-l-4 border-brand p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-brand text-white rounded-full text-sm font-bold">
                !
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-brand mb-2">
                Important Notice
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Please ensure all items are in their original condition before
                initiating a return. This helps us process your return quickly
                and ensures other customers receive products in perfect
                condition.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PolicyPageLayout>
  );
};

export default ReturnPolicy;
