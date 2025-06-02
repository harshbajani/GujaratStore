"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type SearchResult = {
  _id: string;
  slug?: string;
  productName: string;
  productCoverImage: string;
  parentCategory: {
    name: string;
  };
};

type SearchDropdownProps = {
  results: SearchResult[];
  isLoading: boolean;
  searchQuery: string;
  onClose: () => void;
};

const SearchDropdown = ({
  results,
  isLoading,
  searchQuery,
  onClose,
}: SearchDropdownProps) => {
  if (!searchQuery) return null;
  const getImageUrl = (imageId: string) => `/api/files/${imageId}`;

  return (
    <div className="absolute top-full left-0 w-full bg-white rounded-md shadow-lg mt-1 z-50 max-h-96 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : results.length > 0 ? (
        <div>
          {results.map((product) => (
            <Link
              href={`/product/${product.slug}`}
              key={product._id}
              onClick={onClose}
              className="flex items-center p-3 hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 relative mr-3 flex-shrink-0">
                <Image
                  src={getImageUrl(product.productCoverImage)}
                  alt={product.productName}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  {product.productName}
                </p>
                <p className="text-xs text-gray-500">
                  {product.parentCategory?.name || "General"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No products found for &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
