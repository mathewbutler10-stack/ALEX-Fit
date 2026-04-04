import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // output: 'standalone', // Removed - causing Vercel 404 issues
  trailingSlash: false, // Explicitly set to false to fix 404 issues
  typescript: {
    // ignoreBuildErrors: true, // REMOVED: All TypeScript errors are now fixed!
  },
};

export default nextConfig;
