import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // output: 'standalone', // Removed - causing Vercel 404 issues
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/owner-login',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
