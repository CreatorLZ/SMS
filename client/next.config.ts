import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance optimizations */
  experimental: {
    optimizePackageImports: ["lucide-react"],
    optimizeCss: true,
  },

  // Enable bundle analyzer in development
  ...(process.env.ANALYZE === "true" && {
    webpack: (config: any) => {
      if (process.env.NODE_ENV === "development") {
        config.plugins.push(
          new (require("webpack-bundle-analyzer").BundleAnalyzerPlugin)({
            analyzerMode: "server",
            openAnalyzer: true,
          })
        );
      }
      return config;
    },
  }),

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
