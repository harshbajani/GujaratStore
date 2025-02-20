"use client";
import Image from "next/image";
import { Button } from "./ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { flavoursOfGujarat, organicBucket } from "@/constants";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const OrganicAndFlavours = () => {
  // * Refs for different sections
  const [titleRef, titleInView] = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });
  const [organicRef, organicInView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [flavoursRef, flavoursInView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // * Animation variants
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section>
      <div className="container mx-auto px-4 py-5">
        {/* Organic Section */}
        <motion.div
          ref={titleRef}
          initial="hidden"
          animate={titleInView ? "visible" : "hidden"}
          variants={titleVariants}
          className="flex-center flex-col mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "2rem" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-black"
            />
            <h2 className="text-lg">ઑર્ગનિક બકેટ</h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "2rem" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
            <h1 className="text-2xl font-bold text-center">
              ORGANIC : A BETTER CHOICE
            </h1>
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
          </div>

          <motion.div
            ref={organicRef}
            variants={containerVariants}
            initial="hidden"
            animate={organicInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16"
          >
            {organicBucket.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <Link href="/organic">
                  <motion.div
                    className="mb-4 rounded-full overflow-hidden w-[250px] h-[250px]"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={item.src}
                      alt={item.title}
                      width={250}
                      height={250}
                      className="object-cover w-full h-full"
                    />
                  </motion.div>

                  <div className="text-center mb-4">
                    <h3 className="text-sm mb-2 px-4 leading-tight min-h-[40px]">
                      {item.title}
                    </h3>
                    <p className="font-bold text-lg">{item.price}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button variant="secondary" className="shadow-md">
                        <Heart
                          className={cn(
                            "text-red-600",
                            item.wishlist && "fill-red-600"
                          )}
                        />
                      </Button>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Flavours Section */}
        <motion.div
          ref={flavoursRef}
          variants={containerVariants}
          initial="hidden"
          animate={flavoursInView ? "visible" : "hidden"}
          className="flex-center flex-col mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "2rem" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-black"
            />
            <h2 className="text-lg">સ્વાદ આખા ગુજરાતનો</h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "2rem" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-px bg-black"
            />
          </div>
          <div className="flex items-center gap-2 mb-12">
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
            <h1 className="text-2xl font-bold">FLAVOURS OF GUJARAT</h1>
            <Image
              src="/decoration.svg"
              alt="decoration"
              width={24}
              height={24}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 w-full">
            <motion.div
              variants={itemVariants}
              className="relative w-full lg:w-[340px] h-[300px] lg:h-[528px]"
              whileHover={{ scale: 1.02 }}
            >
              <Image
                src="/food/puri.jpg"
                alt="puri"
                height={500}
                width={500}
                className="h-full w-full lg:w-[259px] object-cover"
              />
              <motion.div
                className="absolute inset-0 bg-brand/30 flex flex-col justify-center items-center text-white"
                whileHover={{ backgroundColor: "#C93326" }}
              >
                <p className="font-bold text-2xl lg:-ml-16">“સ્વાદ આખા</p>
                <p className="text-4xl lg:text-6xl font-bold">
                  ગુજરાત <span className="text-xl lg:text-2xl">નો”</span>
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="mt-4 text-brand border-brand w-44 hover:bg-brand hover:text-white"
                    asChild
                  >
                    <Link href="/shop">Explore</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-10 w-full">
              {flavoursOfGujarat.map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative w-full mx-auto"
                  whileHover={{ y: -10 }}
                >
                  <Image
                    src={item.src}
                    alt={item.label}
                    height={500}
                    width={500}
                    className="object-cover w-full sm:w-[259px] h-[220px]"
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 lg:left-6 bg-brand text-white w-full lg:w-[215px] h-[45px] flex-center py-2 px-4"
                    whileHover={{ height: "50px" }}
                  >
                    <p className="text-center font-medium text-sm">
                      {item.label}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OrganicAndFlavours;
