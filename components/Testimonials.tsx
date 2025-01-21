"use client";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import TestimonialSlider from "./Slider";

const Testimonials = () => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.3,
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

  return (
    <section>
      <div className="container mx-auto px-4 py-5">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex-center flex-col"
        >
          <div className="flex-center w-full">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-28 w-full">
              {/* First Banner */}
              <motion.div
                variants={itemVariants}
                className="relative w-full lg:w-1/2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full h-[270px]">
                  <Image
                    src="/banner1.jpg"
                    alt="banner"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 564px"
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center text-white"
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                  >
                    <motion.p
                      className="font-bold text-brand text-lg md:text-xl"
                      whileHover={{ scale: 1.05 }}
                    >
                      ખાવાનો સૌથી મોટો આનંદ
                    </motion.p>
                    <motion.p
                      className="text-lg md:text-xl font-bold text-center px-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      Khavda - the traditional pottery of Kutch
                    </motion.p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="mt-4 text-brand border-brand w-44 hover:bg-brand hover:text-white"
                        asChild
                      >
                        <Link href="/shop">Buy Now</Link>
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Second Banner */}
              <motion.div
                variants={itemVariants}
                className="relative w-full lg:w-1/2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative w-full h-[270px]">
                  <Image
                    src="/banner2.png"
                    alt="banner"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 564px"
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center text-white"
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                  >
                    <motion.p
                      className="font-bold text-brand text-lg md:text-xl"
                      whileHover={{ scale: 1.05 }}
                    >
                      બાળપણને યાદગાર બનાવો
                    </motion.p>
                    <motion.p
                      className="text-lg md:text-xl font-bold text-center px-4"
                      whileHover={{ scale: 1.05 }}
                    >
                      Make childhood memorable
                    </motion.p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="mt-4 text-brand border-brand w-44 hover:bg-brand hover:text-white"
                        asChild
                      >
                        <Link href="/shop">Buy Now</Link>
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      <TestimonialSlider />
    </section>
  );
};

export default Testimonials;
