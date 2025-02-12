"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import Link from "next/link";

interface Product {
  _id: string;
  productName: string;
  productCoverImage: string; // This will be the GridFS ID
  mrp: number;
  netPrice: number;
  productImages: string[]; // These will be GridFS IDs
  wishlist?: boolean;
  parentCategory?: {
    name?: string;
  };
}

const OrganicPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [organicRef, organicInView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  // Helper function to construct image URL from GridFS ID
  const getImageUrl = (imageId: string) => `/api/files/${imageId}`;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (data.success) {
          // Filter products where parentCategory.name is "clothing"
          const artisansProducts = data.data.filter(
            (product: Product) =>
              product.parentCategory?.name?.toLowerCase() === "organic"
          );
          setProducts(artisansProducts);
        } else {
          setError("Failed to fetch products");
        }
      } catch (err) {
        setError("Error fetching products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        className="relative h-[273px] w-full"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_50%_right_200px] h-[273px]" />
        <div className="absolute inset-0 bg-brand-200/30 h-[273px]" />
        <motion.div
          className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.h1
            className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl mt-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            નમસ્તે જી
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base md:text-lg mb-5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            Let&apos;s Discover The World Of Gujarat Art & Crafts
          </motion.p>
          <div className="">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Organic</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </motion.div>
      </motion.div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          ref={organicRef}
          variants={containerVariants}
          initial="hidden"
          animate={organicInView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {products.map((product) => (
            <Link href={`/organic/${product._id}`} key={product._id}>
              <motion.div
                variants={containerVariants}
                className="flex flex-col items-center justify-between rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image Container */}
                <div className="mb-4 h-48 w-full overflow-hidden rounded-lg">
                  <Image
                    src={getImageUrl(product.productCoverImage)}
                    alt={product.productName}
                    width={250}
                    height={250}
                    className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Product Info */}
                <div className="flex w-full flex-1 flex-col items-center">
                  <h3 className="mb-2 text-center text-sm font-semibold text-brand line-clamp-2">
                    {product.productName}
                  </h3>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{product.netPrice.toLocaleString("en-IN")}
                    </span>
                    {product.mrp > product.netPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.mrp.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buttons Container */}
                <div className="flex w-full items-center justify-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-1"
                  >
                    <Button
                      variant="secondary"
                      className="shadow-md flex items-center gap-2"
                    >
                      <div className="bg-brand p-2 rounded -ml-3">
                        <ShoppingCart className="size-5 text-white" />
                      </div>
                      Add to cart
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="secondary"
                      className="aspect-square p-2 shadow-sm hover:shadow-md"
                    >
                      <Heart
                        className={cn(
                          "h-5 w-5 text-red-600",
                          product.wishlist && "fill-red-600"
                        )}
                      />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default OrganicPage;
