import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the farsan category
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

    // Filter products that belong to farsan category
    const farsanProducts = products.filter(
      (product) => product.parentCategory?.name?.toLowerCase() === "farsan"
    );

    if (farsanProducts.length === 0) {
      return {
        title: "Farsan - Traditional Indian Snacks",
        description:
          "Discover our collection of traditional Indian farsan and snacks",
        keywords:
          "farsan, indian snacks, traditional snacks, namkeen, savory snacks",
      };
    }

    // Extract metadata from products
    const metaTitles = farsanProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = farsanProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    farsanProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        farsanProducts.map((product) => product.brands?.name).filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("farsan");
    keywordsSet.add("indian snacks");
    keywordsSet.add("traditional snacks");
    keywordsSet.add("namkeen");
    keywordsSet.add("savory snacks");
    keywordsSet.add("indian farsan");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Farsan Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Traditional Indian Snacks`
        : "Farsan Collection - Traditional Indian Snacks | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Explore our authentic farsan collection featuring traditional Indian snacks and namkeen. Discover delicious savory treats made with authentic recipes and premium ingredients.`;

    // Get featured product image for Open Graph
    const featuredImage = farsanProducts[0]?.productCoverImage
      ? `/api/files/${farsanProducts[0].productCoverImage}`
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
        url: "/farsan",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/farsan",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for farsan page:", error);

    // Fallback metadata
    return {
      title: "Farsan Collection - Traditional Indian Snacks",
      description:
        "Explore our authentic farsan collection featuring traditional Indian snacks and namkeen.",
      keywords:
        "farsan, indian snacks, traditional snacks, namkeen, savory snacks, indian farsan",
    };
  }
}

const FarsanPage = () => {
  return <CategoryPage categoryName="farsan" title="Farsan" />;
};

export default FarsanPage;
