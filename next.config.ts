import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // output: 'standalone', // Removed - causing Vercel 404 issues
};

export default nextConfig;
