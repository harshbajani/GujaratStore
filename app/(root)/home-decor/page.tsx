import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the home-decor category
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

    // Filter products that belong to home-decor category
    const homeDecorProducts = products.filter(
      (product) => product.parentCategory?.name?.toLowerCase() === "home-decor"
    );

    if (homeDecorProducts.length === 0) {
      return {
        title: "Home Decor - Beautiful Home Accessories",
        description: "Discover our collection of beautiful home decor items",
        keywords:
          "home decor, home accessories, interior decoration, home styling",
      };
    }

    // Extract metadata from products
    const metaTitles = homeDecorProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = homeDecorProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    homeDecorProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        homeDecorProducts.map((product) => product.brands?.name).filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("home decor");
    keywordsSet.add("home accessories");
    keywordsSet.add("interior decoration");
    keywordsSet.add("home styling");
    keywordsSet.add("decorative items");
    keywordsSet.add("home decoration");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Home Decor Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Beautiful Accessories`
        : "Home Decor Collection - Beautiful Accessories | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Transform your living spaces with our beautiful home decor collection. Find stylish accessories and decorative items to enhance your home's aesthetic.`;

    // Get featured product image for Open Graph
    const featuredImage = homeDecorProducts[0]?.productCoverImage
      ? `/api/files/${homeDecorProducts[0].productCoverImage}`
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
        url: "/home-decor",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/home-decor",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for home-decor page:", error);

    // Fallback metadata
    return {
      title: "Home Decor Collection - Beautiful Accessories",
      description:
        "Transform your living spaces with our beautiful home decor collection.",
      keywords:
        "home decor, home accessories, interior decoration, home styling, decorative items",
    };
  }
}

const HomeDecorPage = () => {
  return <CategoryPage categoryName="home-decor" title="Home Decor" />;
};

export default HomeDecorPage;
