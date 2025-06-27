import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the clothing category
    const clothingProducts = await Products.find({
      productStatus: true,
    })
      .populate([
        {
          path: "parentCategory",
          match: { name: { $regex: /^clothing$/i } },
          select: "name",
        },
        { path: "brands", select: "name" },
      ])
      .select(
        "productName metaTitle metaDescription metaKeywords parentCategory brands productCoverImage netPrice"
      )
      .limit(10)
      .lean()
      .then((products) => products.filter((p) => p.parentCategory !== null));
    if (clothingProducts.length === 0) {
      return {
        title: "Clothing - Fashion & Style",
        description: "Discover our collection of clothing items",
        keywords: "clothing, fashion, style, apparel",
      };
    }

    // Extract metadata from products
    const metaTitles = clothingProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = clothingProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    clothingProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        clothingProducts.map((product) => product.brands?.name).filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("clothing");
    keywordsSet.add("fashion");
    keywordsSet.add("apparel");
    keywordsSet.add("style");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Clothing Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Fashion Store`
        : "Clothing Collection - Fashion & Style | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Discover our premium clothing collection featuring the latest fashion trends. Shop from top brands with quality apparel for every style and occasion.`;

    // Get featured product image for Open Graph
    // const featuredImage = clothingProducts[0]?.productCoverImage;
    const coverImage = clothingProducts[0]?.productCoverImage;
    const featuredImage =
      coverImage && typeof coverImage === "string" && coverImage.trim()
        ? `/api/files/${encodeURIComponent(coverImage)}`
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
        url: "/clothing",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/clothing",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for clothing page:", error);

    // Fallback metadata
    return {
      title: "Clothing Collection - Fashion & Style",
      description:
        "Discover our premium clothing collection featuring the latest fashion trends and styles.",
      keywords: "clothing, fashion, style, apparel, trends",
    };
  }
}

const ClothingPage = () => {
  return <CategoryPage categoryName="clothing" title="Clothing" />;
};

export default ClothingPage;
