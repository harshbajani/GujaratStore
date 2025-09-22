"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { motion } from "framer-motion";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbHeaderEnhancedProps {
  items: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
}

const BreadcrumbHeaderEnhanced = ({
  items,
  title = "નમસ્તે જી",
  subtitle = "Let's Discover The World Of Gujarat Art & Crafts",
}: BreadcrumbHeaderEnhancedProps) => {
  return (
    <motion.div
      className="relative sm:h-[250px] h-[200px] w-full"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_50%_right_200px] sm:h-[250px] h-[200px]" />
      <div className="absolute inset-0 bg-brand-200/30 sm:h-[250px] h-[200px]" />
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <motion.h1
          className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-sm sm:text-base md:text-lg mb-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {subtitle}
        </motion.p>
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                  <div key={index} className="flex items-center">
                    <BreadcrumbItem>
                      {isLast || item.isCurrentPage || !item.href ? (
                        <BreadcrumbPage className="capitalize truncate max-w-[150px] sm:max-w-xs overflow-hidden whitespace-nowrap">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            href={item.href}
                            className="capitalize hover:text-brand transition-colors"
                          >
                            {item.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </div>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BreadcrumbHeaderEnhanced;
