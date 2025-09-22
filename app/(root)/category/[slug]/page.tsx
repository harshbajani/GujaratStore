/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryClient from "./client";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getParentCategoryData(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/category/${slug}`,
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
    console.error("Error fetching parent category data:", error);
    return null;
  }
}

async function getParentCategoryProducts(slug: string, limit: number = 20) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/admin/products/parent-category/${slug}?limit=${limit}`,
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
    console.error("Error fetching parent category products:", error);
    return [];
  }
}

async function getPrimaryCategoriesForParent(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/product-category/parent/${slug}?limit=50`,
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
    console.error("Error fetching primary categories:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parentCategory = await getParentCategoryData(slug);
  const products = await getParentCategoryProducts(slug, 15);
  const primaryCategories = await getPrimaryCategoriesForParent(slug);

  if (!parentCategory) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  // Extract comprehensive data for SEO
  const productNames = products
    .map((product: any) => product.productName)
    .slice(0, 15);
  const brandNames: string[] = [
    ...new Set(
      products
        .map((product: any) => product.brands?.name)
        .filter(Boolean) as string[]
    ),
  ].slice(0, 8);
  const colors = [
    ...new Set(
      products
        .map((product: any) => product.colors?.map((c: any) => c.color))
        .flat()
        .filter(Boolean) as string[]
    ),
  ].slice(0, 10);
  const categoryNames = primaryCategories
    .map((cat: any) => cat.name)
    .slice(0, 10);

  // Calculate price range
  const prices = products
    .map((product: any) => product.netPrice)
    .filter(Boolean);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Generate comprehensive keywords for parent category
  const baseKeywords = [
    parentCategory.name,
    parentCategory.name.toLowerCase(),
    `${parentCategory.name} online shopping`,
    `buy ${parentCategory.name} online`,
    `${parentCategory.name} collection`,
    `${parentCategory.name} products`,
    `${parentCategory.name} store`,
    `${parentCategory.name} Gujarat`,
    `authentic ${parentCategory.name}`,
    `traditional ${parentCategory.name}`,
    "Gujarat handicrafts",
    "Indian crafts",
    "handmade products",
    "authentic Gujarat products",
    "traditional crafts",
    "artisan made",
    "cultural products",
    "heritage crafts",
  ];

  const dynamicKeywords = [
    ...productNames.map((name: string) => name.toLowerCase()),
    ...brandNames.map((brand: string) => brand.toLowerCase()),
    ...colors.map((color: string) => color.toLowerCase()),
    ...categoryNames.map((cat: string) => cat.toLowerCase()),
    ...categoryNames.map(
      (cat: string) => `${cat} ${parentCategory.name.toLowerCase()}`
    ),
    ...(prices.length > 0
      ? [
          `under ₹${maxPrice}`,
          `₹${minPrice} to ₹${maxPrice}`,
          `${parentCategory.name.toLowerCase()} under ${maxPrice}`,
          `affordable ${parentCategory.name.toLowerCase()}`,
        ]
      : []),
  ];

  const allKeywords = [...new Set([...baseKeywords, ...dynamicKeywords])].join(
    ", "
  );

  // Use category's meta information if available, otherwise generate
  const title =
    parentCategory.metaTitle ||
    `${parentCategory.name} - Authentic Gujarat ${parentCategory.name} Collection | Shop Online`;

  const description =
    parentCategory.metaDescription ||
    `Explore authentic ${parentCategory.name} from Gujarat. Discover ${
      products.length
    }+ premium ${parentCategory.name.toLowerCase()} products${
      categoryNames.length > 0
        ? ` across ${categoryNames.slice(0, 3).join(", ")}.`
        : "."
    } ${prices.length > 0 ? `Starting from ₹${minPrice}.` : ""} ${
      brandNames.length > 0
        ? `Top brands: ${brandNames.slice(0, 3).join(", ")}.`
        : ""
    } Free shipping across India on authentic Gujarat handicrafts.`;

  const keywords = parentCategory.metaKeywords || allKeywords;
  return {
    title: title.length > 60 ? title.substring(0, 57) + "..." : title,
    description:
      description.length > 160
        ? description.substring(0, 157) + "..."
        : description,
    keywords,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/category/${slug}`,
      siteName: "Gujarat Store",
      images:
        products.length > 0
          ? [
              {
                url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${products[0].productCoverImage}`,
                width: 1200,
                height: 630,
                alt: `${parentCategory.name} collection from Gujarat`,
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
      "product:category": parentCategory.name,
      "product:price:amount": prices.length > 0 ? minPrice.toString() : "",
      "product:price:currency": "INR",
      "product:availability": "in stock",
      "og:locale:alternate": ["hi_IN", "gu_IN"],
      "product:retailer_category": parentCategory.name,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const parentCategory = await getParentCategoryData(slug);

  if (!parentCategory) {
    notFound();
  }

  return <CategoryClient slug={slug} />;
}
