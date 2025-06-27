import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the artisans category
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

    // Filter products that belong to artisans category
    const artisansProducts = products.filter(
      (product) => product.parentCategory?.name?.toLowerCase() === "artisans"
    );

    if (artisansProducts.length === 0) {
      return {
        title: "Artisans Collection - Handcrafted Excellence",
        description: "Discover our collection of handcrafted artisan products",
        keywords: "artisans, handcrafted, handmade, traditional crafts",
      };
    }

    // Extract metadata from products
    const metaTitles = artisansProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = artisansProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    artisansProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        artisansProducts.map((product) => product.brands?.name).filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("artisans");
    keywordsSet.add("handcrafted");
    keywordsSet.add("handmade");
    keywordsSet.add("traditional crafts");
    keywordsSet.add("artisan products");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Artisans Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Handcrafted Excellence`
        : "Artisans Collection - Handcrafted Excellence | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Discover our exclusive artisans collection featuring handcrafted products made with traditional techniques. Shop unique handmade items from skilled artisans.`;

    // Get featured product image for Open Graph
    const featuredImage = artisansProducts[0]?.productCoverImage
      ? `/api/files/${artisansProducts[0].productCoverImage}`
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
        url: "/artisans",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/artisans",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for artisans page:", error);

    // Fallback metadata
    return {
      title: "Artisans Collection - Handcrafted Excellence",
      description:
        "Discover our exclusive artisans collection featuring handcrafted products made with traditional techniques.",
      keywords:
        "artisans, handcrafted, handmade, traditional crafts, artisan products",
    };
  }
}

const ArtisansPage = () => {
  return <CategoryPage categoryName="artisans" title="Artisans Collection" />;
};

export default ArtisansPage;
