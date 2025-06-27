import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Get products from the furnishings category
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

    // Filter products that belong to furnishings category
    const furnishingsProducts = products.filter(
      (product) => product.parentCategory?.name?.toLowerCase() === "furnishings"
    );

    if (furnishingsProducts.length === 0) {
      return {
        title: "Furnishings - Home & Office Furniture",
        description:
          "Discover our collection of quality furnishings and furniture",
        keywords: "furnishings, furniture, home decor, office furniture",
      };
    }

    // Extract metadata from products
    const metaTitles = furnishingsProducts
      .map((product) => product.metaTitle)
      .filter(Boolean)
      .slice(0, 3);

    const metaDescriptions = furnishingsProducts
      .map((product) => product.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Collect all keywords
    const keywordsSet = new Set<string>();
    furnishingsProducts.forEach((product) => {
      if (product.metaKeywords) {
        product.metaKeywords.split(",").forEach((keyword: string) => {
          keywordsSet.add(keyword.trim());
        });
      }
    });

    // Get brand names for additional keywords
    const brandNames = [
      ...new Set(
        furnishingsProducts
          .map((product) => product.brands?.name)
          .filter(Boolean)
      ),
    ];
    brandNames.forEach((brand) => keywordsSet.add(brand));

    // Add category-specific keywords
    keywordsSet.add("furnishings");
    keywordsSet.add("furniture");
    keywordsSet.add("home decor");
    keywordsSet.add("office furniture");
    keywordsSet.add("home furnishings");

    const keywords = Array.from(keywordsSet).join(", ");

    // Create title from product meta titles or fallback
    const title =
      metaTitles.length > 0
        ? `Furnishings Collection - ${metaTitles
            .slice(0, 2)
            .join(" | ")} | Quality Furniture`
        : "Furnishings Collection - Quality Furniture | Your Store";

    // Create description from product meta descriptions or fallback
    const description =
      metaDescriptions.length > 0
        ? metaDescriptions.join(". ").substring(0, 160)
        : `Explore our premium furnishings collection featuring quality furniture for home and office. Find stylish and durable pieces to enhance your living spaces.`;

    // Get featured product image for Open Graph
    const featuredImage = furnishingsProducts[0]?.productCoverImage
      ? `/api/files/${furnishingsProducts[0].productCoverImage}`
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
        url: "/furnishings",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: featuredImage ? [featuredImage] : [],
      },
      alternates: {
        canonical: "/furnishings",
      },
    };
  } catch (error) {
    console.error("Error generating metadata for furnishings page:", error);

    // Fallback metadata
    return {
      title: "Furnishings Collection - Quality Furniture",
      description:
        "Explore our premium furnishings collection featuring quality furniture for home and office.",
      keywords:
        "furnishings, furniture, home decor, office furniture, home furnishings",
    };
  }
}

const FurnishingsPage = () => {
  return <CategoryPage categoryName="furnishings" title="Furnishings" />;
};

export default FurnishingsPage;
