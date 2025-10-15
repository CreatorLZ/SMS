import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Turbopack configuration to set the correct root directory
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)), // Points to the client/ directory
  },
};

export default nextConfig;
