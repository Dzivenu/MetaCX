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

  // ESLint configuration moved to eslint.config.mjs in Next.js 16

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: env.NODE_ENV === "production",
  },

  // Remove deprecated swcMinify option - SWC is enabled by default in Next.js 15

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Server-side external packages (don't bundle for server)
  serverExternalPackages: ["convex"],

  // Enable webpack 5 optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Fix for "self is not defined" error in SSR
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        encoding: false,
        canvas: false,
      };
    }

    // Optimize for development with Turbo
    if (dev) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    return config;
  },
};

export default nextConfig;
