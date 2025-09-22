/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { useBlogsInfinite } from "@/hooks/useBlogsInfinite";
import { BlogImage } from "@/components/BlogImage";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import {
  BlogSkeletonGrid,
  BlogLoadMoreSkeleton,
} from "@/components/BlogSkeletonLoader";

const ClientBlogs = ({ initialBlog }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [blogRef, blogInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const {
    blogs: filteredBlogs,
    isLoading,
    isLoadingMore,
    error,
    loadMoreRef,
  } = useBlogsInfinite({
    initialLimit: 12,
    searchTerm,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Show loading state for initial load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <BreadcrumbHeader subtitle="Blogs" title="Home" titleHref="/" />
        <div className="py-16">
          <BlogSkeletonGrid count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Error Loading Blogs
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Breadcrumb Hero */}
      <BreadcrumbHeader subtitle="Blogs" title="Home" titleHref="/" />

      {/* Search Bar */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="py-8"
      >
        <div className="dynamic-container mx-auto px-4 flex justify-start">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search blogs"
              role="searchbox"
              className="pl-10 h-12"
            />
          </div>
        </div>
      </motion.section>

      {/* Blogs Grid */}
      <motion.section
        ref={blogRef}
        initial="hidden"
        animate={blogInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="py-16"
      >
        <div className="dynamic-container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-8">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog, idx) => (
              <motion.div
                key={blog.id}
                variants={itemVariants}
                custom={idx}
                layout
              >
                <BlogCardGrid blog={blog} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No blogs found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef as unknown as React.RefObject<HTMLDivElement>} />
        {isLoadingMore && <BlogLoadMoreSkeleton />}
      </motion.section>
    </div>
  );
};

// Grid-only blog card
const BlogCardGrid = ({ blog }: { blog: TransformedBlog }) => (
  <Link prefetch href={`/blog/${blog.id}`} className="block group h-full">
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col"
    >
      <div className="relative h-48 overflow-hidden">
        <BlogImage
          imageId={blog.imageId}
          alt={blog.heading}
          fill
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{blog.user}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{blog.date}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-brand transition-colors duration-300">
          {blog.heading}
        </h3>

        <div
          dangerouslySetInnerHTML={{ __html: blog.description }}
          className="text-gray-600 text-sm mb-4 flex-1 overflow-hidden max-h-10 overflow-ellipsis"
        />

        <div className="flex items-center text-brand font-semibold group-hover:gap-2 transition-all duration-300 mt-auto">
          <span>Read More</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </motion.div>
  </Link>
);

export default ClientBlogs;
