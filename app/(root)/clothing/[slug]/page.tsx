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

    // Use product's meta data or fallback to generated content
    const title =
      product.metaTitle ||
      `${product.productName} - ${product.brands?.name} | ${product.parentCategory?.name}`;

    const description =
      product.metaDescription ||
      `Buy ${product.productName} from ${
        product.brands?.name
      }. ${product.productDescription
        ?.replace(/<[^>]*>/g, "")
        .substring(0, 100)}... Shop now at best prices.`;

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
      ].filter(Boolean);
      keywords = keywordArray.join(", ");
    }

    const productImage = `/api/files/${product.productCoverImage}`;

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
        url: `/${product.parentCategory?.name?.toLowerCase()}/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description.substring(0, 160),
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

const ClothingDetailPage = () => {
  return (
    <div>
      <ProductsDetailPage />
      <SimilarProducts />
    </div>
  );
};

export default ClothingDetailPage;
