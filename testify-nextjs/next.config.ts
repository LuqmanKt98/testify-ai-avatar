import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled to prevent duplicate HeyGen sessions in development
  reactStrictMode: false,
};

export default nextConfig;
