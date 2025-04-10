"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  imageSrc: string;
  description: string;
  link: string;
  overlayColor?: string;
}

export function FeatureCard({
  title,
  icon,
  imageSrc,
  description,
  link,
  overlayColor = "green", // Default color
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Generate the overlay class based on the provided color
  const getOverlayClass = () => {
    // Default is green if no color is provided
    if (!overlayColor) return "bg-green-500/40";

    // Map color names to their corresponding Tailwind classes
    switch (overlayColor) {
      case "blue":
        return "bg-blue-500/80";
      case "red":
        return "bg-red-500/80";
      case "pink":
        return "bg-pink-500/80";
      case "amber":
        return "bg-amber-500/80";
      case "emrald":
        return "bg-emerald-500/80";
      case "orange":
        return "bg-orange-500/80";
      case "yellow":
        return "bg-yellow-500/60";
      case "teal":
        return "bg-red-500/80";
      case "indigo":
        return "bg-indigo-500/80";
      case "cyan":
        return "bg-cyan-500/80";
      default:
        return "bg-green-500/80"; // Fallback to green
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <Link
        href={link}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="relative overflow-hidden rounded-lg h-64 lg:h-84 group"
          whileHover={{
            scale: 1.02,
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 15 },
            boxShadow: { duration: 0.2 },
          }}
        >
          {/* Background image */}
          <motion.div className="absolute inset-0">
            <Image
              src={imageSrc || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover z-0"
            />
            <motion.div
              className="absolute inset-0"
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
            />
          </motion.div>

          {/* Permanent blackish overlay */}
          <div className="absolute inset-0 bg-black/50 z-10"></div>

          {/* Colored overlay that slides up from bottom */}
          <motion.div
            className={cn("absolute inset-0 z-20", getOverlayClass())}
            initial={{ y: "100%" }}
            animate={{ y: isHovered ? 0 : "100%" }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          />

          {/* Content container - positioned ABOVE all overlays */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
            <motion.div
              className="bg-white/20 p-4 rounded-full backdrop-blur-none"
              animate={{
                y: isHovered ? -16 : 0,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
            >
              <motion.div
                animate={{ rotate: isHovered ? [0, -5, 5, -3, 3, 0] : 0 }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  delay: 0.1,
                }}
              >
                {icon}
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="text-white text-center px-4 max-w-xs mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <p className="text-sm font-medium leading-loose">
                    {description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Title bar - positioned ABOVE overlays but below the colored overlay when sliding */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30">
            <motion.h3
              className="text-xl font-bold text-white text-center"
              animate={{
                scale: isHovered ? 1.05 : 1,
                y: isHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h3>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
