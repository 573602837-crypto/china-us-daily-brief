import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  typedRoutes: false,
  experimental: {
    webpackBuildWorker: false
  }
};

export default nextConfig;
