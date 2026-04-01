import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // output: 'standalone', // Removed - causing Vercel 404 issues
  trailingSlash: true, // Try to fix Vercel routing 404s
};

export default nextConfig;
