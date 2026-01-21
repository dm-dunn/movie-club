import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  // Output standalone for optimal Docker/deployment performance
  output: "standalone",
  // Enable strict mode for better error catching
  reactStrictMode: true,
};

export default nextConfig;
