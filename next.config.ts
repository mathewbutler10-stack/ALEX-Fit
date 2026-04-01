import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // output: 'standalone', // Removed - causing Vercel 404 issues
  // trailingSlash: true, // Causing 308 redirects but still 404
};

export default nextConfig;
