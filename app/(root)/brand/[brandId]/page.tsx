import BrandProductsPage from "@/components/BrandProductsPage";

interface BrandPageProps {
  params: Promise<{
    brandId: string;
  }>;
}

const BrandPage = async ({ params }: BrandPageProps) => {
  const { brandId } = await params;

  return <BrandProductsPage brandId={brandId} />;
};

export default BrandPage;

