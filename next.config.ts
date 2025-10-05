import type { NextConfig } from "next";
import { env } from "./src/shared/config/env";

const nextConfig: NextConfig = {
  /* Turbo compiler configuration */
  experimental: {
    // Enable Turbo compiler optimizations
    turbo: {
      // Remove the problematic rules configuration
    },
    // Enable tree shaking for heavy packages
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/dates",
      "@mantine/charts",
      "@mantine/modals",
      "@mantine/notifications",
      "@tabler/icons-react",
      "recharts",
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: env.NODE_ENV === "production",
  },

  // Remove deprecated swcMinify option - SWC is enabled by default in Next.js 15

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Enable webpack 5 optimizations
  webpack: (config, { dev }) => {
    // Optimize for development with Turbo
    if (dev) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Production optimizations
    if (!dev) {
      // Enable webpack optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            mantine: {
              test: /[\\/]node_modules[\\/]@mantine[\\/]/,
              name: "mantine",
              chunks: "all",
            },
            convex: {
              test: /[\\/]node_modules[\\/]convex[\\/]/,
              name: "convex",
              chunks: "all",
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
