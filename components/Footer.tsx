import { FooterLinks, SocialLinks } from "@/constants";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-black text-white mt-auto py-8">
      <div className="container mx-auto px-4">
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
                href="https://goo.gl/maps/xyz"
                className="text-brand text-sm"
              >
                View Google Map
              </Link>
            </div>
          </div>

          {/* Right Side with Links and Social */}
          <div className="w-full md:w-auto">
            <div className="mb-4">
              <h3 className="text-white mb-2">More Links</h3>
              <div className="flex flex-wrap gap-x-4">
                {FooterLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.route}
                    className="text-gray-300 hover:text-brand text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4 mt-4">
              {SocialLinks.map((social, index) => (
                <Link key={index} href={social.url} className="text-white">
                  <Image
                    src={social.src}
                    width={20}
                    height={20}
                    alt="social media"
                    className="w-5 h-5"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright - Now with border line */}
        <div className="mt-8 pt-4 border-t border-gray-800 text-center text-sm text-gray-400">
          Copyright © 2025 <span className="text-brand">The Gujarat Store</span>{" "}
          all rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
