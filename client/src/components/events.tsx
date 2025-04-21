"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const Events = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.1,
      },
    },
  };

  return (
    <motion.section
      className="py-12 px-4 bg-gray-50 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex flex-col items-center gap-4 px-1 sm:gap-8 mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2
            className="max-w-[720px] font-bold text-primary-green text-3xl leading-tight sm:text-5xl sm:leading-tight text-center"
            variants={titleVariants}
          >
            Latest News & Updates
          </motion.h2>
          <motion.p
            className="text-md max-w-[600px] font-medium text-primary-green-text sm:text-xl text-center"
            variants={titleVariants}
          >
            Check out what&apos;s been going on at Treasure Land
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Card 1 */}
          <motion.div
            className="border rounded-lg overflow-hidden cursor-pointer bg-white shadow-sm"
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              transition: { duration: 0.3 },
            }}
          >
            <motion.div
              className="h-48 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/graduation2.jpg"
                alt="School Event"
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="p-4">
              <motion.div
                className="text-sm text-gray-500 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                March 15, 2024
              </motion.div>
              <motion.h3
                className="font-bold mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Annual Science Fair
              </motion.h3>
              <motion.p
                className="text-gray-600 mb-4 line-clamp-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Students showcase their innovative science projects at our
                annual science fair.
              </motion.p>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Link
                  href="#"
                  className="text-primary hover:underline font-medium"
                >
                  Read More
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="border rounded-lg overflow-hidden cursor-pointer bg-white shadow-sm"
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              transition: { duration: 0.3 },
            }}
          >
            <motion.div
              className="h-48 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/outdoor.jpg"
                alt="Sports Day"
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="p-4">
              <motion.div
                className="text-sm text-gray-500 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                March 10, 2024
              </motion.div>
              <motion.h3
                className="font-bold mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Inter-House Sports Competition
              </motion.h3>
              <motion.p
                className="text-gray-600 mb-4 line-clamp-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Students compete in various athletic events during our annual
                inter-house sports day.
              </motion.p>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Link
                  href="/#"
                  className="text-primary hover:underline font-medium"
                >
                  Read More
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            className="border rounded-lg overflow-hidden cursor-pointer bg-white shadow-sm"
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              transition: { duration: 0.3 },
            }}
          >
            <motion.div
              className="h-48 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/culture.jpg"
                alt="Cultural Day"
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="p-4">
              <motion.div
                className="text-sm text-gray-500 mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                February 28, 2024
              </motion.div>
              <motion.h3
                className="font-bold mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                Cultural Day Celebration
              </motion.h3>
              <motion.p
                className="text-gray-600 mb-4 line-clamp-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Students celebrate Nigeria&apos;s rich cultural heritage through
                performances, food, and traditional attire.
              </motion.p>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Link
                  href="/#"
                  className="text-primary hover:underline font-medium"
                >
                  Read More
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Events;
