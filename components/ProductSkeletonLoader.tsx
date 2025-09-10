import { Skeleton } from "@/components/ui/skeleton";

interface ProductSkeletonProps {
  count?: number;
}

export const ProductSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-between rounded-lg bg-white p-6 shadow-sm mt-20">
      {/* Image Container */}
      <div className="mb-4 h-48 w-full overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Product Info */}
      <div className="flex w-full flex-1 flex-col items-center">
        {/* Product Name */}
        <Skeleton className="h-4 w-3/4 mb-2" />

        {/* Brand */}
        <Skeleton className="h-3 w-1/2 mb-2" />

        {/* Price */}
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Rating */}
        <div className="flex items-center mb-2 gap-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-12 ml-1" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex w-full items-center justify-center gap-2 mt-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
};

export const ProductSkeletonGrid = ({ count = 8 }: ProductSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-8">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

export const LoadMoreSkeleton = () => {
  return (
    <div className="flex justify-center py-8">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
        <span className="text-sm text-gray-500">Loading more products...</span>
      </div>
    </div>
  );
};
