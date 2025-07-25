import CategoryPage from "@/components/CategoryPage";
import Products from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongodb";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

// Move these above the try block
const defaultTitle = "Premium Dry Fruits & Nuts | Healthy Snacks & Gifts";
const defaultDescription =
  "Explore our premium selection of dry fruits and nuts—almonds, cashews, pistachios, raisins, and more. Healthy, natural snacking for every occasion.";
const defaultKeywords =
  "dry fruits, nuts, almonds, cashews, pistachios, raisins, healthy snacks, gourmet gifts, natural ingredients";

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDB();

    // Fetch active products
    const products = await Products.find({ productStatus: true })
      .populate([
        { path: "parentCategory", select: "name" },
        { path: "brands", select: "name" },
      ])
      .select(
        "productName metaTitle metaDescription metaKeywords parentCategory brands productCoverImage netPrice"
      )
      .limit(20)
      .lean();

    // Only include products in "Dry Fruits & Nuts" category
    const categorySlug = "dry fruits and nuts";
    const dryNuts = products.filter(
      (p) => p.parentCategory?.name?.toLowerCase() === categorySlug
    );

    if (!dryNuts.length) {
      return {
        title: defaultTitle,
        description: defaultDescription,
        keywords: defaultKeywords,
        alternates: { canonical: "/nuts-and-dry-fruit" },
      };
    }

    // Use up to three product-specific titles/descriptions
    const metaTitles = dryNuts
      .map((p) => p.metaTitle)
      .filter(Boolean)
      .slice(0, 3);
    const metaDescs = dryNuts
      .map((p) => p.metaDescription)
      .filter(Boolean)
      .slice(0, 3);

    // Gather all keywords from products, brands, and defaults
    const keywordsSet = new Set<string>();
    dryNuts.forEach((p) => {
      if (p.metaKeywords)
        p.metaKeywords
          .split(",")
          .forEach((k: string) => keywordsSet.add(k.trim()));
      if (p.brands?.name) keywordsSet.add(p.brands.name);
    });
    defaultKeywords.split(",").forEach((k) => keywordsSet.add(k.trim()));

    const title =
      metaTitles.length > 0
        ? `${metaTitles[0]} | ${metaTitles[1] ?? "Dry Fruits & Nuts"}`
        : defaultTitle;
    const description =
      metaDescs.length > 0
        ? metaDescs.join(". ").substring(0, 160)
        : defaultDescription;
    const keywords = Array.from(keywordsSet).join(", ");

    const openGraphImage = dryNuts[0]?.productCoverImage
      ? `/api/files/${dryNuts[0].productCoverImage}`
      : undefined;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        images: openGraphImage ? [openGraphImage] : [],
        type: "website",
        url: "/nuts-and-dry-fruit",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: openGraphImage ? [openGraphImage] : [],
      },
      alternates: { canonical: "/nuts-and-dry-fruit" },
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return {
      title: defaultTitle,
      description: defaultDescription,
      keywords: defaultKeywords,
      alternates: { canonical: "/nuts-and-dry-fruit" },
    };
  }
}

const DryFruitNutsPage = () => (
  <CategoryPage categoryName="nuts-and-dry-fruit" title="Dry Fruits and Nuts" />
);

export default DryFruitNutsPage;
