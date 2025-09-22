/* eslint-disable @typescript-eslint/no-explicit-any */
import { Metadata } from "next";
import ProductsDetailPage from "@/components/ProductDetails";
import SimilarProducts from "@/components/SimilarProducts";
import React from "react";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper function to fetch product data
async function getProductData(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/admin/products/slug/${slug}`,
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
    console.error("Error fetching product data:", error);
    return null;
  }
}

// Helper function to fetch reviews for the product
async function getProductReviews(productId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/reviews/product/${productId}`,
      {
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      return { reviews: [], averageRating: 0, totalReviews: 0 };
    }

    const data = await response.json();
    return data.success
      ? data.data
      : { reviews: [], averageRating: 0, totalReviews: 0 };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return { reviews: [], averageRating: 0, totalReviews: 0 };
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    };
  }

  const reviewData = await getProductReviews(product._id || "");
  const { averageRating, totalReviews } = reviewData;

  // Extract comprehensive product data for SEO
  const productName = product.productName;
  const brand = (product.brands as any)?.name || "";
  const primaryCategory = (product.primaryCategory as any)?.name || "";
  const parentCategory =
    (product.primaryCategory as any)?.parentCategory?.name || "";
  const colors = product.productColor || "";
  const sizes =
    product.productSize
      ?.map((s: any) => s.sizeId?.label || s.size?.label)
      .filter(Boolean)
      .join(", ") || "";

  // Price information
  const price = product.netPrice;
  const mrp = product.mrp;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // Generate comprehensive keywords
  const baseKeywords = [
    productName,
    productName.toLowerCase(),
    `${productName} online`,
    `buy ${productName}`,
    `${productName} price`,
    `${productName} Gujarat`,
    `authentic ${productName}`,
    `handmade ${productName}`,
    brand ? brand.toLowerCase() : "",
    primaryCategory ? primaryCategory.toLowerCase() : "",
    parentCategory ? parentCategory.toLowerCase() : "",
    "Gujarat handicrafts",
    "Indian crafts",
    "traditional crafts",
    "artisan made",
    "authentic products",
    "handmade products",
    "Gujarat store",
    "cultural products",
    "heritage crafts",
  ].filter(Boolean);

  const dynamicKeywords = [
    ...(colors ? colors.split(", ").map((c: string) => c.toLowerCase()) : []),
    ...(sizes ? sizes.split(", ").map((s: string) => s.toLowerCase()) : []),
    ...(brand
      ? [
          `${brand} ${primaryCategory}`.toLowerCase(),
          `${brand} products`.toLowerCase(),
          `${brand} ${parentCategory}`.toLowerCase(),
        ]
      : []),
    ...(primaryCategory
      ? [
          `${primaryCategory} online`.toLowerCase(),
          `buy ${primaryCategory}`.toLowerCase(),
          `${primaryCategory} collection`.toLowerCase(),
        ]
      : []),
    ...(discount > 0
      ? [
          `${discount}% off`,
          `discount ${productName.toLowerCase()}`,
          `sale ${productName.toLowerCase()}`,
        ]
      : []),
    ...(averageRating > 0
      ? [
          `${averageRating} star rated`,
          `top rated ${primaryCategory?.toLowerCase() || "product"}`,
          "best rated product",
        ]
      : []),
  ];

  const allKeywords = [...new Set([...baseKeywords, ...dynamicKeywords])].join(
    ", "
  );

  // Use product's meta information if available, otherwise generate
  const title =
    product.metaTitle ||
    `${productName}${brand ? ` by ${brand}` : ""} - Authentic Gujarat ${
      primaryCategory || "Product"
    } | Shop Online`;

  const description =
    product.metaDescription ||
    `${productName}${brand ? ` from ${brand}` : ""}${
      parentCategory ? ` - Premium ${parentCategory}` : ""
    }. ${primaryCategory ? `Authentic ${primaryCategory} ` : ""}from Gujarat${
      colors ? ` available in ${colors}` : ""
    }${sizes ? ` with sizes: ${sizes}` : ""}. Price: ₹${price}${
      discount > 0 ? ` (${discount}% off from ₹${mrp})` : ""
    }${
      averageRating > 0
        ? `. Rated ${averageRating}/5 by ${totalReviews} customers`
        : ""
    }. Free shipping across India.`;

  const keywords = product.metaKeywords || allKeywords;

  // Schema.org structured data for products
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: productName,
    image: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${product.productCoverImage}`,
    description: description,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    category: primaryCategory,
    sku: product._id,
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/product/${slug}`,
      priceCurrency: "INR",
      price: price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.productQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Gujarat Store",
      },
    },
    ...(averageRating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    manufacturer: {
      "@type": "Organization",
      name: brand || "Gujarat Artisan",
    },
    material: product.material || "Handcrafted",
    color: colors || undefined,
    size: sizes || undefined,
  };

  return {
    title: title.length > 60 ? title.substring(0, 57) + "..." : title,
    description:
      description.length > 160
        ? description.substring(0, 157) + "..."
        : description,
    keywords,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/product/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/product/${slug}`,
      siteName: "Gujarat Store",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${product.productCoverImage}`,
          width: 1200,
          height: 630,
          alt: productName,
        },
        ...(product.productImages?.slice(0, 3).map((img: any) => ({
          url: `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${img}`,
          width: 800,
          height: 600,
          alt: `${productName} - Additional view`,
        })) || []),
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/files/${product.productCoverImage}`,
      ],
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
      "og:type": "product",
      "product:price:amount": price.toString(),
      "product:price:currency": "INR",
      "product:availability":
        product.productQuantity > 0 ? "in stock" : "out of stock",
      "product:condition": "new",
      "product:brand": brand || "",
      "product:category": primaryCategory || "",
      "product:retailer_category": parentCategory || "",
      "og:locale:alternate": ["hi_IN", "gu_IN"],
      "application-ld+json": JSON.stringify(structuredData),
    },
  };
}

const ProductDetailPage = async () => {
  return (
    <>
      <ProductsDetailPage />
      <SimilarProducts />
    </>
  );
};

export default ProductDetailPage;
