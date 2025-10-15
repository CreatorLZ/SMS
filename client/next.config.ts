import type { NextConfig } from "next";

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
    root: __dirname, // Points to the client/ directory
  },
};

export default nextConfig;
