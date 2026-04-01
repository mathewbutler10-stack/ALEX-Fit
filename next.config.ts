import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone', // Recommended for Vercel deployments
};

export default nextConfig;
