"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPublicBlogs, getBlogById } from "@/lib/actions/blog.actions";
import Loader from "@/components/Loader";
import { BlogImage } from "@/components/BlogImage";

interface ClientBlogPageProps {
  initialBlog: TransformedBlog | null;
}

const ClientBlogPage = ({ initialBlog }: ClientBlogPageProps) => {
  // * useStates
  const [blog, setBlog] = useState<TransformedBlog | null>(initialBlog);
  const [relatedBlogs, setRelatedBlogs] = useState<TransformedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // * Fetching the data of the blog
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const blogData = await getBlogById(initialBlog?.id as string);
        setBlog(blogData ?? null);
        const response = await getPublicBlogs();
        const filtered = (response.data || [])
          .filter((b) => b.id !== initialBlog?.id)
          .slice(0, 2);
        setRelatedBlogs(filtered);
      } catch {
        setError("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    if (initialBlog?.id) {
      fetchBlogData();
    }
  }, [initialBlog?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Blog not found</h1>
          <Button asChild className="mt-4 bg-brand hover:bg-brand/90">
            <Link prefetch href="/">
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-[120px] pb-16"
    >
      <div className="dynamic-container max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link
          prefetch
          href="/blogs"
          className="inline-flex items-center gap-2 text-brand hover:text-brand/80 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>

        {/* Hero Section */}
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-8">
          {blog.imageId && (
            <BlogImage
              imageId={blog.imageId}
              alt={blog.heading}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {blog.heading}
            </h1>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{blog.user}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{blog.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="prose prose-lg max-w-none"
        >
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.description }}
          />

          {/* Meta Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Category</h3>
            <p className="text-gray-600">{blog.category}</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Keywords</h3>
            <p className="text-gray-600">{blog.metaKeywords}</p>
          </div>
        </motion.div>

        {/* Related Posts Section */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  prefetch
                  key={relatedBlog.id}
                  href={`/blog/${relatedBlog.id}`}
                  className="group"
                >
                  <div className="relative h-48 rounded-lg overflow-hidden mb-3">
                    <BlogImage
                      imageId={relatedBlog.imageId}
                      alt={relatedBlog.heading}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                    {relatedBlog.heading}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {relatedBlog.date}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ClientBlogPage;
