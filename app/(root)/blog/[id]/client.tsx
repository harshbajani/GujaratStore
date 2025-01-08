"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { getBlogById } from "@/lib/actions/blog.actions";
import Loader from "@/components/Loader";

interface Blog {
  id: string;
  image: string;
  heading: string;
  user: string;
  date: string;
  description: string;
  category: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

const ClientBlogIdPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await getBlogById(id as string);
        if (data) {
          setBlog(data);
        } else {
          setError("Blog not found");
        }
      } catch (err) {
        setError("Failed to fetch blog");
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id]);

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
          <h1 className="text-2xl font-bold text-gray-800">
            {error || "Blog not found"}
          </h1>
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand hover:text-brand/80 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="prose prose-lg max-w-none"
        >
          <div
            dangerouslySetInnerHTML={{ __html: blog.description }}
            className="text-gray-700 leading-relaxed"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ClientBlogIdPage;
