import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  metadataBase: new URL("https://gujarat-store.vercel.app"),
  openGraph: {
    title: "Gujarat Store",
    description: "Let's Discover The World Of Gujarat Art & Crafts",
    url: "https://gujarat-store.vercel.app",
    images: [
      {
        url: "https://gujarat-store.vercel.app/thumbnail.png", // Path to your logo
        width: 1200, // Recommended dimensions for Open Graph
        height: 630,
        alt: "Gujarat Store Logo",
      },
    ],
    siteName: "Gujarat Store",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gujarat Store",
    description: "Let's Discover The World Of Gujarat Art & Crafts",
    images: ["https://gujarat-store.vercel.app/thumbnail.png"], // Same path as above
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${playfair.variable} font-poppins antialiased`}
      >
        {children}
      </body>
      <Toaster />
    </html>
  );
}
