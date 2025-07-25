import ProductsDetailPage from "@/components/ProductDetails";
import SimilarProducts from "@/components/SimilarProducts";
import { Metadata } from "next";
import { connectToDB } from "@/lib/mongodb";
import Products from "@/lib/models/product.model";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  try {
    await connectToDB();

    const { slug } = await params;

    const product = (await Products.findOne({
      slug,
      productStatus: true,
    })
      .populate([
        { path: "parentCategory", select: "name" },
        { path: "primaryCategory", select: "name" },
        { path: "secondaryCategory", select: "name" },
        { path: "brands", select: "name" },
      ])
      .select(
        "productName metaTitle metaDescription metaKeywords productDescription productCoverImage netPrice mrp discountValue discountType parentCategory primaryCategory secondaryCategory brands productColor"
      )
      .lean()) as IProductResponse | null;

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    // Build title and description
    const title =
      product.metaTitle ||
      `${product.productName} - ${product.brands?.name} | ${product.parentCategory?.name}`;

    const baseDescription =
      product.metaDescription ||
      `Buy ${product.productName} from ${
        product.brands?.name
      }. ${product.productDescription
        ?.replace(/<[^>]*>/g, "")
        .substring(0, 100)}... Shop now at best prices.`;
    const description = baseDescription.substring(0, 160);

    // Keywords: combine backend with extras
    const extraKeywords = [
      "nuts-and-dry-fruit",
      "dry fruits",
      "nuts",
      "almonds",
      "cashews",
      "pistachios",
      "raisins",
      "healthy snacks",
      "organic",
      "natural",
      "healthy",
      "eco-friendly",
      "sustainable",
    ];

    // Start with product.metaKeywords if any
    const keywordsSet = new Set<string>();
    if (product.metaKeywords) {
      product.metaKeywords.split(",").forEach((k) => keywordsSet.add(k.trim()));
    }

    // Add product-specific fields
    [
      product.productName,
      product.brands?.name,
      product.parentCategory?.name,
      product.primaryCategory?.name,
      product.secondaryCategory?.name,
      product.productColor,
    ]
      .filter(Boolean)
      .forEach((k) => keywordsSet.add(k as string));

    // Add extra keywords
    extraKeywords.forEach((k) => keywordsSet.add(k));

    // Final keywords string
    const keywords = Array.from(keywordsSet).join(", ");

    // Open Graph & Twitter image
    const productImage = `/api/files/${product.productCoverImage}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: [
          {
            url: productImage,
            width: 800,
            height: 600,
            alt: product.productName,
          },
        ],
        type: "website",
        url: `/${encodeURIComponent(
          product.parentCategory?.name?.toLowerCase() || "nuts-and-dry-fruit"
        )}/${encodeURIComponent(slug)}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [productImage],
      },
      alternates: {
        canonical: `/${product.parentCategory?.name?.toLowerCase()}/${slug}`,
      },
      // Additional structured data for e-commerce
      other: {
        "product:price:amount": product.netPrice.toString(),
        "product:price:currency": "INR",
        "product:availability": "in stock",
        "product:condition": "new",
        "product:brand": product.brands?.name || "",
        "product:category": `${product.parentCategory?.name} > ${product.primaryCategory?.name} > ${product.secondaryCategory?.name}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata for product:", error);

    // Fallback metadata
    return {
      title: "Product Details",
      description: "View product details and specifications.",
    };
  }
}

const DryFruitAndNutsDetailsPage = () => {
  return (
    <>
      <ProductsDetailPage />
      <SimilarProducts />
    </>
  );
};

export default DryFruitAndNutsDetailsPage;
