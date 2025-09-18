import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the food category
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

    // Filter products that belong to food category
    const foodProducts = products.filter(
      (product) => product.parentCategory?.name?.toLowerCase() === "food"
    );

    if (foodProducts.length === 0) {
      return {
        title: "Food & Groceries - Fresh, Tasty & Healthy Selections",
        description:
          "Discover our wide range of food products, from snacks to essentials, all fresh and delicious.",
        keywords:
          "food, groceries, snacks, beverages, healthy food, pantry essentials",
      };
    }

    // Extract metadata from products
    const metaTitles = foodProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = foodProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    foodProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        foodProducts.map((product) => product.brands?.name).filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("food");
    keywordsSet.add("groceries");
    keywordsSet.add("snacks");
    keywordsSet.add("beverages");
    keywordsSet.add("healthy food");
    keywordsSet.add("pantry essentials");
    keywordsSet.add("organic food");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Food Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Fresh & Delicious`
        : "Food Collection - Fresh & Delicious Selections | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Explore our premium food collection featuring fresh groceries, tasty snacks, and healthy essentials for every meal and occasion.`;

    // Get featured product image for Open Graph
    const featuredImage = foodProducts[0]?.productCoverImage
      ? `/api/files/${foodProducts[0].productCoverImage}`
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
        url: "/food",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/food",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for food page:", error);

    // Fallback metadata
    return {
      title: "Food Collection - Fresh & Delicious Selections",
      description:
        "Explore our premium food collection featuring fresh groceries, snacks, and healthy essentials.",
      keywords:
        "food, groceries, snacks, beverages, healthy food, pantry essentials, organic food",
    };
  }
}

const FoodPage = () => {
  return <CategoryPage categoryName="food" title="Food" />;
};

export default FoodPage;
