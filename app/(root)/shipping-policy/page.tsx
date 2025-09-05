import PolicyPageLayout from "@/components/PolicyPageLayout";

const ShippingPolicy = () => {
  return (
    <PolicyPageLayout title="Shipping Policy">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Order Processing
          </h2>
          <p className="text-gray-700 leading-relaxed">
            All orders are processed within 2-3 business days of placement,
            excluding weekends and holidays. During peak seasons or promotional
            periods, processing times may be extended, and customers will be
            notified accordingly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. Shipping Methods and Delivery Times
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We offer standard and expedited shipping options. Estimated delivery
            times vary by location:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed ml-4">
            <li>
              <strong>Standard Shipping:</strong> 5-7 business days within India
            </li>
            <li>
              <strong>Expedited Shipping:</strong> 2-4 business days within
              India
            </li>
            <li>
              <strong>International Shipping:</strong> 7-15 business days
              depending on destination
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Delivery times are estimates and may be affected by unforeseen
            delays such as customs processing or courier suspensions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. Shipping Costs
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Shipping charges are calculated at checkout based on the shipping
            method chosen and destination. Free shipping offers, if any, will be
            clearly specified on the website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Shipping Restrictions
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Certain products may have shipping restrictions based on size,
            weight, or destination due to legal or logistical reasons. We do not
            ship to P.O. boxes or APO/FPO addresses.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. Order Tracking
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Once your order is shipped, a tracking number will be provided via
            email to help you monitor your shipment until delivery.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            6. Customs, Duties, and Taxes
          </h2>
          <p className="text-gray-700 leading-relaxed">
            For international shipments, customs fees, import duties, and taxes
            may apply and are the responsibility of the recipient. Please check
            local regulations before ordering.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            7. Lost or Damaged Packages
          </h2>
          <p className="text-gray-700 leading-relaxed">
            If your package is lost or arrives damaged, please contact our
            customer support immediately. We will work with the carrier to
            resolve the issue or arrange a replacement, subject to verification.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            8. Returns and Exchanges
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Please refer to our Return Policy for details on how to return or
            exchange items purchased.
          </p>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-700 leading-relaxed">
            <strong>
              By placing an order with THE GUJARAT STORE, you agree to this
              shipping policy and understand the terms outlined above.
            </strong>
          </p>
          <p className="text-gray-700 mt-4">
            For any questions, please contact{" "}
            <a
              href="mailto:contact@thegujaratstore.com"
              className="text-brand hover:underline font-medium"
            >
              contact@thegujaratstore.com
            </a>
          </p>
        </section>
      </div>
    </PolicyPageLayout>
  );
};

export default ShippingPolicy;
