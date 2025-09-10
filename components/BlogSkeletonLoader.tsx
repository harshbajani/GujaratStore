import { Skeleton } from "@/components/ui/skeleton";

interface BlogSkeletonProps {
  count?: number;
}

export const BlogSkeleton = () => {
  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 flex flex-col">
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-16 h-3" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>

        {/* Title */}
        <Skeleton className="w-full h-5 mb-2" />
        <Skeleton className="w-3/4 h-5 mb-3" />

        {/* Description */}
        <div className="flex-1">
          <Skeleton className="w-full h-3 mb-1" />
          <Skeleton className="w-5/6 h-3 mb-1" />
          <Skeleton className="w-4/6 h-3" />
        </div>

        {/* Read More */}
        <div className="flex items-center mt-4">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-4 h-4 ml-2" />
        </div>
      </div>
    </div>
  );
};

export const BlogSkeletonGrid = ({ count = 6 }: BlogSkeletonProps) => {
  return (
    <div className="dynamic-container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <BlogSkeleton key={`blog-skeleton-${index}`} />
      ))}
    </div>
  );
};

export const BlogLoadMoreSkeleton = () => {
  return (
    <div className="flex justify-center py-8">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
        <span className="text-sm text-gray-500">Loading more blogs...</span>
      </div>
    </div>
  );
};
