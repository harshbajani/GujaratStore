import React from "react";

interface PolicyPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const PolicyPageLayout: React.FC<PolicyPageLayoutProps> = ({ title, children }) => {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="dynamic-container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-playfair mb-4">
              {title}
            </h1>
            <div className="w-20 h-1 bg-brand mx-auto"></div>
          </div>

          {/* Content Container */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 lg:p-12">
            <div className="prose prose-lg prose-gray max-w-none">
              {children}
            </div>
          </div>

          {/* Contact Information Footer */}
          <div className="mt-8 text-center text-gray-600">
            <p className="text-sm">
              For questions about this policy, please contact us at{" "}
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

export default PolicyPageLayout;
