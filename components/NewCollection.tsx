"use client";
import React, { useState } from "react";
import Image from "next/image";
import { newCollection } from "@/constants";
import { Button } from "./ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const isImageItem = (item: ImageItem | ContentItem): item is ImageItem => {
  return "src" in item && "label" in item;
};

const CollectionItem: React.FC<CollectionItemProps> = ({
  item,
  isImageType,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.2,
        ease: "easeOut",
      },
    },
  };

  if (isImageType && isImageItem(item)) {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={itemVariants}
        className="relative w-full h-80 group cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={item.src}
            alt={item.label}
            className="w-full h-full object-cover"
            width={400}
            height={320}
          />
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-black/50 flex flex-col items-center justify-end pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h3
            className="text-white text-3xl font-bold mb-4 font-playfair"
            animate={{
              y: isHovered ? -64 : 0,
              transition: { duration: 0.3 },
            }}
          >
            {item.label}
          </motion.h3>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{
              y: isHovered ? 0 : 100,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Button
              className="text-white px-6 py-2 rounded bg-brand hover:bg-white hover:text-brand"
              asChild
            >
              <Link href="/shop">Buy Now</Link>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (!isImageType && !isImageItem(item)) {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={itemVariants}
        className="w-full h-80 bg-[url('/bg/bg3.jpg')] flex flex-col items-center justify-center p-8 text-center"
      >
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-medium mb-4 font-poppins"
        >
          {item.title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-poppins font-semibold mb-6"
        >
          {item.description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <Button
            className="border border-brand text-brand px-6 py-2 rounded hover:bg-brand hover:text-white transition-colors"
            variant="outline"
            asChild
          >
            <Link href="/shop">Buy Now</Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return null;
};

const NewCollection: React.FC = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const gridItems: { image: ImageItem; content: ContentItem }[] = [];

  for (let i = 0; i < newCollection.length - 1; i += 2) {
    const imageItem = newCollection[i] as ImageItem;
    const contentItem = newCollection[i + 1] as ContentItem;

    if (imageItem && contentItem) {
      gridItems.push({
        image: imageItem,
        content: contentItem,
      });
    }
  }

  return (
    <section>
      <div className="dynamic-container mx-auto px-4 py-16">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={headerVariants}
          className="flex flex-col items-center mb-12"
        >
          <motion.div
            className="flex items-center gap-3 mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-8 h-px bg-black" />
            <h2 className="text-lg">એકદમ ફ્રેશ</h2>
            <div className="w-8 h-px bg-black" />
          </motion.div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
            <h1 className="text-2xl font-bold">NEW COLLECTION</h1>
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 ">
          {gridItems.map((pair, index) => (
            <React.Fragment key={index}>
              <CollectionItem
                item={pair.image}
                isImageType={true}
                index={index * 2}
              />
              <CollectionItem
                item={pair.content}
                isImageType={false}
                index={index * 2 + 1}
              />
              {index === gridItems.length - 1 &&
                newCollection[newCollection.length - 1] && (
                  <CollectionItem
                    item={newCollection[newCollection.length - 1] as ImageItem}
                    isImageType={true}
                    index={newCollection.length - 1}
                  />
                )}
            </React.Fragment>
          ))}
        </div>
      </div>
      <motion.div
        className="relative min-h-[180px] w-full sm:min-h-[220px] md:min-h-[600px]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-[url('/bg/bg4.jpg')] bg-cover bg-no-repeat" />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative text-white flex h-full flex-col items-center justify-center p-4 text-center sm:p-6 md:p-8">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h1 mb-2 text-2xl sm:text-3xl md:text-8xl mt-14 sm:mt-44 font-playfair"
          >
            THE GUJARAT STORE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm sm:text-base md:text-2xl font-bold sm:mt-8 mt-0 text-brand"
          >
            ગુજરાત થી તમારા ઘર આંગણે.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
};

export default NewCollection;
