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

const BreadcrumbHeader = ({
  title,
  subtitle,
  titleHref,
}: {
  title: string;
  subtitle: string;
  titleHref: string;
}) => {
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
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={titleHref}>{title}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{subtitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BreadcrumbHeader;
