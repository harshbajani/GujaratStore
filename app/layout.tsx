import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair-display",
});

export const metadata: Metadata = {
  title: "Gujarat Store",
  description: "Let's Discover The World Of Gujarat Art & Crafts",
  icons: [
    {
      url: "https://gujarat-store.vercel.app/_next/image?url=%2Flogo.png&w=128&q=75",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="og:title" content="Gujarat Store" />
        <meta
          property="og:description"
          content="Let's Discover The World Of Gujarat Art & Crafts"
        />
        <meta
          property="og:image"
          content="https://gujarat-store.vercel.app/_next/image?url=%2Flogo.png&w=128&q=75"
        />
        <meta property="og:url" content="https://gujarat-store.vercel.app" />
        <meta property="og:type" content="website" />
      </head>
      <body
        className={`${poppins.variable} ${playfair.variable} font-poppins antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
