/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductCategoryClient from "./client";
export const dynamic = "force-dynamic";

interface ProductCategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCategoryData(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/product-category/${slug}`,
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching category data:", error);
    return null;
  }
}

async function getCategoryProducts(slug: string, limit: number = 20) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/admin/products/primary-category/${slug}?limit=${limit}`,
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching category products:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryData(slug);
  const products = await getCategoryProducts(slug, 10);

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }
  const productNames = products
    .map((product: any) => product.productName)
    .slice(0, 10);
  const brandNames = [
    ...new Set(
      products.map((product: any) => product.brands?.name).filter(Boolean)
    ),
  ].slice(0, 5);
  const colors = [
    ...new Set(
      products
        .map((product: any) => product.colors?.map((c: any) => c.color))
        .flat()
        .filter(Boolean) as string[]
    ),
  ].slice(0, 10);

  // Calculate price range
  const prices = products
    .map((product: any) => product.netPrice)
    .filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Generate comprehensive keywords
  const baseKeywords = [
    category.name,
    category.name.toLowerCase(),
    `${category.name} online`,
    `buy ${category.name}`,
    `${category.name} shopping`,
    `${category.name} collection`,
    `${category.name} products`,
    `${category.name} store`,
    `${category.name} Gujarat`,
    "Gujarat handicrafts",
    "Indian crafts",
    "handmade products",
    "authentic Gujarat products",
    "traditional crafts",
    "artisan made",
  ];

  const dynamicKeywords = [
    ...productNames.map((name: string) => name.toLowerCase()),
    ...brandNames.map((brand: unknown) => (brand as string).toLowerCase()),
    ...colors.map((color: string) => color.toLowerCase()),
    ...(category.parentCategory
      ? [
          category.parentCategory.name,
          category.parentCategory.name.toLowerCase(),
        ]
      : []),
    ...(prices.length > 0
      ? [`under ₹${maxPrice}`, `₹${minPrice} to ₹${maxPrice}`]
      : []),
  ];

  const allKeywords = [...new Set([...baseKeywords, ...dynamicKeywords])].join(
    ", "
  );

  // Use category's meta information if available, otherwise generate
  const title =
    category.metaTitle ||
    `${category.name} - Authentic Gujarat Products | Shop Online`;

  const description =
    category.metaDescription ||
    `Discover authentic ${
      category.name
    } from Gujarat. Shop premium quality ${category.name.toLowerCase()} with ${
      products.length
    }+ products${prices.length > 0 ? ` starting from ₹${minPrice}` : ""}. ${
      brandNames.length > 0
        ? `Top brands: ${brandNames.slice(0, 3).join(", ")}.`
        : ""
    } Free shipping across India.`;

  const keywords = category.metaKeywords || allKeywords;

  return {
    title: title.length > 60 ? title.substring(0, 57) + "..." : title,
    description:
      description.length > 160
        ? description.substring(0, 157) + "..."
        : description,
    keywords,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/product-category/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/product-category/${slug}`,
      siteName: "Gujarat Store",
      images:
        products.length > 0
          ? [
              {
                url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${products[0].productCoverImage}`,
                width: 1200,
                height: 630,
                alt: `${category.name} collection`,
              },
            ]
          : [],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images:
        products.length > 0
          ? [
              `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${products[0].productCoverImage}`,
            ]
          : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
    },
    other: {
      "product:price:amount": prices.length > 0 ? minPrice.toString() : "",
      "product:price:currency": "INR",
      "product:availability": "in stock",
      "og:locale:alternate": ["hi_IN", "gu_IN"],
    },
  };
}

export default async function ProductCategoryPage({
  params,
}: ProductCategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryData(slug);

  if (!category) {
    notFound();
  }

  return <ProductCategoryClient slug={slug} />;
}
