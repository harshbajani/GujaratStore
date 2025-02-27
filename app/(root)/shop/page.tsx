"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import {
  artisan,
  clothing,
  flavoursOfGujarat,
  furnishings,
  homeDecor,
  organic,
} from "@/constants";

interface CategorySectionProps {
  title: string;
  items: { src: string; label: string }[];
}

// Enhanced animation variants
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    rotateX: 45,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

const titleVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: 30,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

const imageHoverVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

const CategorySection = ({ title, items }: CategorySectionProps) => {
  return (
    <>
      <motion.div
        className="flex-center gap-2 mb-8 pt-16"
        variants={titleVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          whileInView={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Image
            src="/decoration.svg"
            alt="decoration"
            width={25}
            height={25}
          />
        </motion.div>
        <h1 className="h2">{title}</h1>
        <motion.div
          initial={{ rotate: 180, opacity: 0 }}
          whileInView={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Image
            src="/decoration.svg"
            alt="decoration"
            width={25}
            height={25}
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 max-w-7xl gap-8 mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="relative group cursor-pointer overflow-hidden"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <motion.div
              className="w-full h-44 relative"
              variants={imageHoverVariants}
            >
              <Image
                src={item.src}
                alt={item.label}
                width={170}
                height={200}
                className="w-full h-full object-cover rounded"
              />
              <motion.div
                className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent rounded-b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              <motion.h2
                className="absolute bottom-2 w-full text-center text-white subtitle-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {item.label}
              </motion.h2>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};

const ShopPage = () => {
  return (
    <div className="min-h-screen">
      <motion.div
        className="relative min-h-[180px] w-full sm:min-h-[220px] md:min-h-[240px]"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-[url('/bg/bg1.png')] bg-cover bg-center sm:bg-contain md:bg-[top_50%_right_200px] h-[273px]" />
        <div className="absolute inset-0 bg-brand-200/30 h-[273px]" />
        <motion.div
          className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center sm:p-6 md:p-8 mt-14"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            type: "spring",
            stiffness: 100,
          }}
        >
          <motion.h1
            className="h1 mb-2 text-2xl sm:text-3xl md:text-4xl sm:mt-14 mt-20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            નમસ્તે જી
          </motion.h1>
          <motion.p
            className="subtitle-1 text-sm sm:text-base md:text-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            Let&apos;s Discover The World Of Gujarat Art & Crafts
          </motion.p>
        </motion.div>
      </motion.div>

      <div className="pt-8">
        <div className="py-16 flex-center flex-col">
          <CategorySection title="Clothing" items={clothing} />
          <CategorySection title="Artisan's" items={artisan} />
          <CategorySection title="Farsan" items={flavoursOfGujarat} />
          <CategorySection title="Furnishings" items={furnishings} />
          <CategorySection title="Home Decor" items={homeDecor} />
          <CategorySection title="Organic" items={organic} />
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
