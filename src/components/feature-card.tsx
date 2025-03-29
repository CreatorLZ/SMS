"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        return "bg-blue-500/60";
      case "red":
        return "bg-red-500/60";
      case "pink":
        return "bg-pink-500/60";
      case "amber":
        return "bg-amber-500/60";
      case "emrald":
        return "bg-emerald-500/60";
      case "orange":
        return "bg-orange-500/60";
      case "yellow":
        return "bg-yellow-500/60";
      case "teal":
        return "bg-red-500/60";
      case "indigo":
        return "bg-indigo-500/40";
      case "cyan":
        return "bg-cyan-500/60";
      default:
        return "bg-green-500/60"; // Fallback to green
    }
  };

  return (
    <Link
      href={link}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-lg h-64 lg:h-84 transition-all duration-300 hover:shadow-xl group">
        {/* Background image */}
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-500 z-0",
            isHovered ? "scale-110" : "scale-100"
          )}
        />

        {/* Permanent blackish overlay */}
        <div className="absolute inset-0 bg-black/50 transition-all duration-300 z-10 bg-"></div>

        {/* Colored overlay that slides up from bottom */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-in-out transform z-20 ",
            getOverlayClass(),
            isHovered ? "translate-y-0" : "translate-y-full"
          )}
        ></div>

        {/* Content container - positioned ABOVE all overlays */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
          <div
            className={cn(
              "bg-white/20 p-4 rounded-full backdrop-blur-none transition-all duration-300",
              isHovered ? "transform -translate-y-4" : ""
            )}
          >
            {icon}
          </div>

          {isHovered && (
            <div className="text-white text-center px-4 max-w-xs transition-opacity duration-300 opacity-100 mt-2">
              <p className="text-sm font-medium">{description}</p>
            </div>
          )}
        </div>

        {/* Title bar - positioned ABOVE overlays but below the colored overlay when sliding */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30">
          <h3 className="text-xl font-bold text-white text-center">{title}</h3>
        </div>
      </div>
    </Link>
  );
}
