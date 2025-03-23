"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CurvedUnderline from "./svg/curved-plane";

const testimonial = {
  quote:
    "At Treasure Land School, we believe in nurturing not just academic excellence, but the whole child. Our dedicated team of educators works tirelessly to create an environment where every student can discover their unique potential and thrive.",
  author: "Mrs. Ijewemen Lucy, Principal of Treasure Land School",
  image: "/principal.jpg",
};

const decorationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
  hover: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.3, ease: "easeOut" },
  },
};

export default function JoinOurFamily() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gray-50">
      {/* Decorative elements*/}
      <motion.div
        className="absolute top-[-65px] lg:top-36 left-0 lg:left-10 w-16 h-16 text-primary-green opacity-30  lg:rotate-180"
        variants={decorationVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        animate={isHovered ? "hover" : "visible"}
      >
        <CurvedUnderline />
      </motion.div>

      <motion.div
        className="absolute lg:bottom-[-10px] bottom-[-50px] right-10 w-52 h-52 text-primary-green opacity-30"
        variants={decorationVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        animate={isHovered ? "hover" : "visible"}
      >
        <CurvedUnderline />
      </motion.div>

      <div className="container mx-auto px-4">
        <div
          className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image */}
          <motion.div
            className="w-full lg:ml-12 lg:w-1/3 relative rounded-[35px] overflow-hidden shadow-xl order-last md:order-none"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ scale: 1.03 }}
          >
            <Image
              src={testimonial.image || "/placeholder.svg"}
              alt="principal at Treasure Land School"
              width={600}
              height={400}
              className="w-full h-auto lg:h-96 object-cover aspect-[4/3]"
            />
            <motion.div
              className="absolute inset-0 "
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            className="w-full md:w-1/2 lg:text-left text-center"
            variants={contentVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-primary-green mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Welcome to Treasure Land Model School
            </motion.h2>

            <motion.blockquote
              className="text-lg md:text-xl text-primary-green-text mb-6 relative pl-4 border-l-4 border-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <p className="italic">"{testimonial.quote}"</p>
              <footer className="mt-4 text-sm font-medium">
                — {testimonial.author}
              </footer>
            </motion.blockquote>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Button
                className="bg-primary-green hover:bg-primary-green/90 text-white font-medium px-6 py-5 rounded-full transition-all flex items-center gap-2 group w-fit mx-auto lg:mx-0"
                asChild
              >
                <Link href="#">
                  Apply Today
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
