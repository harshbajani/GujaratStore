"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { getPublicBlogs } from "@/lib/actions/blog.actions";
import { features } from "@/constants";
import { BlogImage } from "@/components/BlogImage";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ClientFeaturesAndBlogs = ({ initialBlog }: any) => {
  // * useStates and hooks
  const [blogs, setBlogs] = useState<TransformedBlog[]>(initialBlog);
  const [blogRef, blogInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // * Fetching all blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await getPublicBlogs();
        setBlogs(response.data ?? []);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <>
      {/* Blogs Section */}
      <motion.section
        ref={blogRef}
        initial="hidden"
        animate={blogInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="py-16"
      >
        <div className="dynamic-container mx-auto px-4">
          <motion.h2
            variants={itemVariants}
            className="text-center text-3xl font-bold mb-8 flex items-center justify-center gap-2"
          >
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
            BLOGS
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Left Column */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6">
              {blogs[0] && <BlogCard blog={blogs[0]} />}
              {blogs[1] && <BlogCard blog={blogs[1]} />}
            </motion.div>

            {/* Middle Column - Larger Blog */}
            <motion.div variants={itemVariants} className="h-full">
              {blogs[2] && <BlogCard blog={blogs[2]} featured />}
            </motion.div>

            {/* Right Column */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6">
              {blogs[3] && <BlogCard blog={blogs[3]} />}
              {blogs[4] && <BlogCard blog={blogs[4]} />}
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="flex items-center justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/blogs" className="flex gap-2">
            See All Blogs <ArrowRight />
          </Link>
        </Button>
      </div>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="py-12"
      >
        <div className="dynamic-container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center px-4 relative"
              >
                {index < features.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-8 -translate-y-1/2 w-px h-16 bg-brand" />
                )}
                <div className="flex-center gap-2">
                  <div className="h-px w-8 bg-brand" />
                  <h2 className="text-brand">{feature.heading}</h2>
                  <div className="h-px w-8 bg-brand" />
                </div>
                <h1 className="text-brand flex-center gap-2 mb-4 font-semibold text-xl">
                  <Image
                    src="/decoration.svg"
                    alt="decoration"
                    width={24}
                    height={24}
                  />
                  {feature.title}
                  <Image
                    src="/decoration.svg"
                    alt="decoration"
                    width={24}
                    height={24}
                  />
                </h1>
                <p className="text-brand text-sm body-1">{feature.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
};

const BlogCard = ({
  blog,
  featured = false,
}: {
  blog: TransformedBlog;
  featured?: boolean;
}) => {
  if (!blog) return null;

  const cardHeight = featured ? "h-full" : "h-[250px]";

  return (
    <Link prefetch href={`/blog/${blog.id}`} className="block h-full">
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-lg overflow-hidden ${cardHeight} cursor-pointer`}
      >
        <BlogImage
          imageId={blog.imageId}
          alt={blog.heading}
          fill
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="opacity-80">{blog.user}</span>
            <span className="opacity-80">•</span>
            <span className="opacity-80">{blog.date}</span>
          </div>
          <h3
            className={`${
              featured ? "text-xl" : "text-lg"
            } font-semibold line-clamp-2`}
          >
            {blog.heading}
          </h3>
          {featured && (
            <div
              dangerouslySetInnerHTML={{ __html: blog.description }}
              className="mt-2 text-sm opacity-90 line-clamp-2"
            />
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default ClientFeaturesAndBlogs;
