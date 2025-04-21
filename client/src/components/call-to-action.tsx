"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import CurvedUnderline from "./svg/curved-plane";
import { motion } from "framer-motion";
import StarTrail from "./svg/star-trail";
import StarTrail2 from "./svg/star-trail2";

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

const Call = () => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <section className="relative py-16 px-4 bg-gray-50 lg:h-[65vh]">
      {/* Decorative elements*/}
      <motion.div
        className="absolute top-[22px] opacity-0 hidden lg:block lg:top-2 left-8 lg:left-10 w-16 h-16 text-primary-green lg:opacity-30  "
        variants={decorationVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        animate={isHovered ? "hover" : "visible"}
      >
        <StarTrail2 />
      </motion.div>

      <motion.div
        className="absolute lg:bottom-10 bottom-[-10px] hidden lg:block right-10 w-52 h-52 text-primary-green opacity-30"
        variants={decorationVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        animate={isHovered ? "hover" : "visible"}
      >
        <StarTrail />
      </motion.div>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className=" font-bold text-primary-green text-3xl pb-3.5 leading-tight sm:text-5xl sm:leading-tight">
          Ready To Join Treasure Land?
        </h2>
        <p className="text-lg mb-8 text-primary-green-text text-center">
          Take the first step towards providing your child with quality
          education and a bright future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center ">
          <Button className="bg-primary-green text-primary-foreground hover:bg-primary-green-hover text-lg px-6 py-3 cursor-pointer border-t-primary-green-text">
            Enroll Now
          </Button>
          <Button
            variant="outline"
            className="text-lg px-6 py-3 text-primary-green-text cursor-pointer"
          >
            Schedule a Visit
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Call;
