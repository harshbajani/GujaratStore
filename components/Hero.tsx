"use client";
import Image from "next/image";
// import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { homeImageCircles } from "@/constants";

// Hero Component
const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const circleVariants = {
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col items-center"
    >
      {/* Hero Background Section */}
      <div className="relative min-h-[180px] w-full sm:min-h-[220px] md:min-h-[240px]">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-[url('/bg/hero-bg.png')] bg-cover bg-center bg-no-repeat h-[450px]"
        />
        <div className="absolute inset-0 bg-black/5 h-[450px]" />
        <div className="relative text-white z-10 flex flex-col items-center justify-center sm:items-start sm:justify-start h-full p-4 sm:p-6 md:p-16 text-center sm:text-left mt-14">
          <motion.p
            variants={itemVariants}
            className="text-5xl sm:text-base md:text-5xl font-extralight sm:mt-0 mt-16"
          >
            Bringing the{" "}
            <motion.strong
              whileHover={{ scale: 1.05 }}
              className="font-bold font-playfair"
            >
              Authentic
            </motion.strong>
          </motion.p>
          <motion.h1
            variants={itemVariants}
            className="mt-5 text-[75px] font-semibold"
          >
            ગુજરાત
          </motion.h1>
          <motion.div variants={itemVariants}>
            <Button
              className="w-36 bg-brand hover:bg-white px-4 py-2 mt-4 text-white hover:text-brand rounded"
              asChild
            >
              {/* <Link prefetch href="/shop">
                Buy now
              </Link> */}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Section with Line and Images */}
      <div className="relative flex flex-col items-center justify-center mt-24 sm:mt-32">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="hidden sm:block absolute rounded-full md:w-[700px] md:h-3 lg:w-[800px] lg:h-3 xl:w-[1171px] xl:h-[18px] bg-brand z-0"
        />
        <div className="flex flex-col sm:flex-row sm:space-x-16 z-10 space-y-8 sm:space-y-0">
          {homeImageCircles.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              className="flex flex-col items-center"
            >
              <motion.div
                variants={circleVariants}
                className="rounded-full md:mt-3 bg-white p-2 hover:bg-brand transition-colors duration-150"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={500}
                  height={500}
                  className="rounded-full object-cover object-top size-44 md:size-24 lg:size-40 xl:size-52"
                />
              </motion.div>
              <motion.p
                variants={itemVariants}
                className="mt-2 text-center text-lg font-semibold"
              >
                {item.label}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
export default Hero;
