"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { blogList } from "@/constants";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

const BlogIdPage = () => {
  const { id } = useParams();

  // Find the blog post based on id
  const blog = blogList.find((blog) => blog.id === Number(id));

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Blog not found</h1>
          <Button asChild className="mt-4 bg-brand hover:bg-brand/90">
            <Link href="/">Go Home</Link>
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
      <div className="container max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand hover:text-brand/80 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>

        {/* Hero Section */}
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-8">
          <Image
            src={blog.image}
            alt={blog.heading}
            fill
            className="object-cover"
            priority
          />
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
          <p className="text-gray-700 leading-relaxed">{blog.description}</p>

          {/* Adding some dummy content for better visualization */}
          <p className="text-gray-700 leading-relaxed mt-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Key Highlights
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>First important point about this topic</li>
            <li>Second crucial aspect to consider</li>
            <li>Third significant element of the discussion</li>
          </ul>

          <blockquote className="border-l-4 border-brand pl-4 italic my-8">
            &quot;An interesting quote or highlight from the blog post that
            deserves emphasis&quot;
          </blockquote>
        </motion.div>

        {/* Related Posts Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Related Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogList.slice(0, 2).map((relatedBlog) => (
              <Link
                key={relatedBlog.id}
                href={`/blog/${relatedBlog.id}`}
                className="group"
              >
                <div className="relative h-48 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={relatedBlog.image}
                    alt={relatedBlog.heading}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                  {relatedBlog.heading}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{relatedBlog.date}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogIdPage;
