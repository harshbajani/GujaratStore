import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the organic category
    const products = await Products.find({
      productStatus: true,
    })
      .populate([
        { path: "parentCategory", select: "name" },
        { path: "brands", select: "name" },
      ])
      .select(
        "productName metaTitle metaDescription metaKeywords parentCategory brands productCoverImage netPrice"
      )
      .limit(10)
      .lean();

    // Filter products that belong to organic category
    const organicProducts = products.filter(
      (product) => product.parentCategory?.name?.toLowerCase() === "organic"
    );

    if (organicProducts.length === 0) {
      return {
        title: "Organic Products - Natural & Healthy Living",
        description: "Discover our collection of organic and natural products",
        keywords: "organic, natural, healthy, eco-friendly, sustainable",
      };
    }

    // Extract metadata from products
    const metaTitles = organicProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = organicProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    organicProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        organicProducts.map((product) => product.brands?.name).filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("organic");
    keywordsSet.add("natural");
    keywordsSet.add("healthy");
    keywordsSet.add("eco-friendly");
    keywordsSet.add("sustainable");
    keywordsSet.add("organic products");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Organic Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Natural Living`
        : "Organic Collection - Natural Living | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Explore our organic collection featuring natural and healthy products. Discover eco-friendly and sustainable options for a better lifestyle.`;

    // Get featured product image for Open Graph
    const featuredImage = organicProducts[0]?.productCoverImage
      ? `/api/files/${organicProducts[0].productCoverImage}`
      : null;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
        type: "website",
        url: "/organic",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/organic",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for organic page:", error);

    // Fallback metadata
    return {
      title: "Organic Collection - Natural Living",
      description:
        "Explore our organic collection featuring natural and healthy products.",
      keywords:
        "organic, natural, healthy, eco-friendly, sustainable, organic products",
    };
  }
}

const OrganicPage = () => {
  return <CategoryPage categoryName="organic" title="Organic" />;
};

export default OrganicPage;
