import ProductsDetailPage from "@/components/ProductDetails";
import SimilarProducts from "@/components/SimilarProducts";
import { Metadata } from "next";
import { connectToDB } from "@/lib/mongodb";
import Products from "@/lib/models/product.model";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

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
        title: "Food Product Not Found",
        description:
          "The requested food item could not be found. Explore our delicious collection instead!",
      };
    }

    // Use product's meta data or fallback to generated content
    const title =
      product.metaTitle ||
      `${product.productName} - ${product.brands?.name} | ${product.parentCategory?.name}`;

    const description =
      product.metaDescription ||
      `Enjoy ${product.productName} from ${
        product.brands?.name
      }. ${product.productDescription
        ?.replace(/<[^>]*>/g, "")
        .substring(
          0,
          100
        )}... Fresh, tasty, and ready to delight your taste buds.`;

    // Keywords from product meta or generate from product data
    let keywords = product.metaKeywords || "";
    if (!keywords) {
      const keywordArray = [
        product.productName,
        product.brands?.name,
        product.parentCategory?.name,
        product.primaryCategory?.name,
        product.secondaryCategory?.name,
        product.productColor,
        "food",
        "groceries",
        "snacks",
        "beverages",
        "healthy food",
        "pantry essentials",
        "organic",
      ].filter(Boolean);
      keywords = keywordArray.join(", ");
    }

    const productImage = `/api/files/${product.productCoverImage}`;

    // Determine base category path (fallback to "food" if parent category missing)
    const categoryPath = product.parentCategory?.name?.toLowerCase() || "food";

    return {
      title,
      description: description.substring(0, 160),
      keywords,
      openGraph: {
        title,
        description: description.substring(0, 160),
        images: [
          {
            url: productImage,
            width: 800,
            height: 600,
            alt: product.productName,
          },
        ],
        type: "website",
        url: `/${categoryPath}/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description.substring(0, 160),
        images: [productImage],
      },
      alternates: {
        canonical: `/${categoryPath}/${slug}`,
      },
      // Additional structured data for e-commerce (still relevant for food products)
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
    console.error("Error generating metadata for food product:", error);

    // Fallback metadata
    return {
      title: "Food Product Details",
      description:
        "View details, ingredients, pricing, and more for this delicious food item.",
    };
  }
}

const FoodDetailPage = () => {
  return (
    <>
      <ProductsDetailPage />
      <SimilarProducts />
    </>
  );
};

export default FoodDetailPage;
