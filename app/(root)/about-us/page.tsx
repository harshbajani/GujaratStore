"use client";
import Image from "next/image";

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="dynamic-container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-playfair mb-4">
              About Us
            </h1>
            <div className="w-20 h-1 bg-brand mx-auto"></div>
          </div>

          <div className="space-y-16">
            {/* Why Gujarat Store Section - Content Left, Image Right */}
            <section className="bg-white rounded-lg shadow-sm p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair mb-6">
                    Why Gujarat Store?
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    The Gujarat Store is committed to providing a unique
                    e-commerce platform where Gujaratis from India can proudly
                    list their products, while Gujaratis from anywhere in the
                    world can easily discover and buy authentic Gujarati
                    products. The platform aims to empower local vendors by
                    giving them a digital marketplace to showcase their diverse
                    offerings and connects Gujarati buyers globally, celebrating
                    and preserving the rich culture and craftsmanship of Gujarat
                    through accessible online commerce.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-lg bg-gradient-to-br from-brand/10 to-brand/20 rounded-lg p-8 flex items-center justify-center">
                    <Image
                      src="/about-us-img1.jpg"
                      alt="Why Gujarat Store - Connecting Gujarati Culture Globally"
                      height={500}
                      width={500}
                      className="w-full h-64 object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE1MCAyMDBMMjUwIDIwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHA+CjxyZWN0IHg9IjE3NSIgeT0iMTI1IiB3aWR0aD0iNTAiIGhlaWdodD0iMjUiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+";
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* What is Gujarat Store Section - Image Left, Content Right */}
            <section className="bg-white rounded-lg shadow-sm p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="flex justify-center order-2 lg:order-1">
                  <div className="w-full max-w-md bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-8 flex items-center justify-center">
                    <Image
                      src="/about-us-img2.jpg"
                      alt="What is Gujarat Store - Authentic Gujarati Products Platform"
                      height={500}
                      width={500}
                      className="w-full h-64 object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkVGM0UyIi8+CjxwYXRoIGQ9Ik0yMDAgMTAwTDE1MCAyMDBMMjUwIDIwMFoiIGZpbGw9IiNGQkJGMjQiLz4KPHA+CjxyZWN0IHg9IjE3NSIgeT0iMjEwIiB3aWR0aD0iNTAiIGhlaWdodD0iMTUiIGZpbGw9IiNGQkJGMjQiLz4KPC9zdmc+";
                      }}
                    />
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair mb-6">
                    What is Gujarat Store?
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    The Gujarat Store is committed to listing only self-checked,
                    curated, and authentic products to ensure the highest
                    quality for its customers. Every product available on the
                    platform undergoes a thorough verification process to
                    guarantee its authenticity and adherence to quality
                    standards. This commitment to quality helps build trust with
                    buyers worldwide, ensuring that they receive genuine
                    Gujarati handicrafts, foods, fashion items, artisan
                    products, clothes, and organic products. By maintaining
                    strict curation and authentication protocols, The Gujarat
                    Store not only supports local vendors but also protects
                    consumers from counterfeit or substandard products,
                    providing confidence and satisfaction with every purchase.
                  </p>
                </div>
              </div>
            </section>

            {/* Our Commitment Section */}
            <section className="bg-white rounded-lg shadow-sm p-8 md:p-12">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair mb-4">
                  Our Commitment
                </h2>
                <div className="w-16 h-1 bg-brand mx-auto"></div>
              </div>

              <div className="space-y-8">
                {/* Commitment 1 */}
                <div className="bg-gradient-to-r from-brand/5 to-orange-50 p-6 rounded-lg border-l-4 border-brand">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🌟 Empowering Global Gujarati Connection
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Gujarat Store is committed to providing a unique
                    e-commerce platform where Gujaratis from India can proudly
                    list their products, while Gujaratis from anywhere in the
                    world can easily discover and buy authentic Gujarati
                    products. The platform aims to empower local vendors by
                    giving them a digital marketplace to showcase their diverse
                    offerings and connects Gujarati buyers globally, celebrating
                    and preserving the rich culture and craftsmanship of Gujarat
                    through accessible online commerce.
                  </p>
                </div>

                {/* Commitment 2 */}
                <div className="bg-gradient-to-r from-orange-50 to-brand/5 p-6 rounded-lg border-l-4 border-orange-400">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    ✅ Authentic & Quality Assurance
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Gujarat Store is committed to listing only self-checked,
                    curated, and authentic products to ensure the highest
                    quality for its customers. Every product available on the
                    platform undergoes a thorough verification process to
                    guarantee its authenticity and adherence to quality
                    standards. This commitment to quality helps build trust with
                    buyers worldwide, ensuring that they receive genuine
                    Gujarati handicrafts, foods, fashion items, artisan
                    products, clothes, and organic products. By maintaining
                    strict curation and authentication protocols, The Gujarat
                    Store not only supports local vendors but also protects
                    consumers from counterfeit or substandard products,
                    providing confidence and satisfaction with every purchase.
                  </p>
                </div>

                {/* Commitment 3 */}
                <div className="bg-gradient-to-r from-brand/5 to-orange-50 p-6 rounded-lg border-l-4 border-brand">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🏛️ Celebrating Every District of Gujarat
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Gujarat Store is dedicated to bringing traditional
                    products from every district of Gujarat, showcasing the rich
                    and diverse heritage of the region. From the intricate
                    Patola silk sarees of Patan to the vibrant Bandhani tie-dye
                    textiles of Jamnagar and Kutch; from the exquisite Rogan art
                    and Kutch embroidery of the Kutch region to the authentic
                    Gir Kesar mangoes and Bhalia wheat of the agricultural
                    belts, the platform aims to represent the unique crafts,
                    foods, and artisan products of each district. By
                    highlighting these district-specific products, The Gujarat
                    Store preserves and promotes the cultural identity and
                    craftsmanship of Gujarat, making it easier for customers
                    worldwide to access genuine traditional products sourced
                    directly from their places of origin within Gujarat. This
                    initiative supports local artisans economically while
                    offering a rich shopping experience rooted in regional
                    authenticity.
                  </p>
                </div>

                {/* Commitment 4 */}
                <div className="bg-gradient-to-r from-orange-50 to-brand/5 p-6 rounded-lg border-l-4 border-orange-400">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🤝 Customer-Centric Excellence
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    At THE GUJARAT STORE, our commitment to customers is
                    centered on delivering an exceptional shopping experience
                    marked by trust, transparency, and reliability. We promise
                    to provide genuine, high-quality products that truly
                    represent Gujarat&apos;s rich cultural heritage. Our
                    customer service team is dedicated to assisting with
                    queries, order support, and resolving any issues promptly
                    and courteously. We prioritize privacy and safeguard your
                    personal information with stringent security measures. We
                    strive to offer timely delivery and clear communication
                    throughout the purchasing process. Above all, we aim to
                    build lasting relationships by continuously improving our
                    services based on your feedback and ensuring your
                    satisfaction with every interaction at The Gujarat Store.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Contact Information Footer */}
          <div className="mt-12 text-center text-gray-600">
            <p className="text-sm">
              For more information about our mission and values, please contact
              us at{" "}
              <a
                href="mailto:contact@thegujaratstore.com"
                className="text-brand hover:underline font-medium"
              >
                contact@thegujaratstore.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AboutUs;
