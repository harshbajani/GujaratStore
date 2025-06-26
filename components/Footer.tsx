import { FooterLinks, NavLinks, SocialLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-black text-white mt-auto py-8">
      <div className="dynamic-container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start">
          {/* Left Side with Logo and Address */}
          <div className="mb-6 md:mb-0">
            <Image
              src="/logo.png"
              height={120}
              width={300}
              alt="The Gujarat Store"
              className="mb-6"
            />
            <div>
              <h3 className="text-white mb-2">Corporate Address</h3>
              <p className="text-gray-300 text-sm mb-1">
                C-18/17 & Road no. 1, Sandar Estate, Ajwa Road, Vadodara-390019
              </p>
              <Link
                prefetch
                href="https://goo.gl/maps/xyz"
                className="text-brand text-sm"
              >
                View Google Map
              </Link>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="mb-4">
              <h3 className="text-white mb-2">Shopping Links:</h3>
              <div className="flex flex-col gap-x-4 space-y-2">
                {NavLinks.map((link, index) => (
                  <Link
                    prefetch
                    key={index}
                    href={link.route}
                    className="text-gray-300 hover:text-brand hover:underline text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="mb-4">
              <h3 className="text-white">Useful Links:</h3>
              <div className="flex flex-col gap-x-4 space-y-2">
                {FooterLinks.map((link, index) => (
                  <Link
                    prefetch
                    key={index}
                    href={link.route}
                    className="text-gray-300 hover:text-brand hover:underline text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Right Side with Links and Social */}
          <div className="w-full md:w-auto">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-white">Email:</h3>
              <div className="flex flex-wrap gap-x-4">
                <Link
                  prefetch
                  href={"mailto:thegujaratstore@gmail.com"}
                  className="text-gray-300 hover:text-brand hover:underline text-sm"
                >
                  thegujaratstore@gmail.com
                </Link>
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-white">Customer Care:</h3>
              <div className="flex flex-wrap gap-x-4">
                <Link
                  prefetch
                  href={"tel:123-4567890"}
                  className="text-gray-300 hover:text-brand hover:underline text-sm"
                >
                  +91 123 45 67890
                </Link>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-2">
              <h3 className="text-white">Follow us:</h3>
              <div className="flex flex-wrap gap-x-4">
                {SocialLinks.map((social, index) => (
                  <Link
                    prefetch
                    key={index}
                    href={social.url}
                    className="text-white"
                  >
                    <social.Icon className="w-5 h-5 hover:text-brand" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - Now with border line */}
        <div className="mt-8 pt-4 border-t border-gray-800 text-center text-sm text-gray-400">
          Copyright © {new Date().getFullYear()}{" "}
          <span className="text-brand">The Gujarat Store</span> All rights
          reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
