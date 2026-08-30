import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  output: "export",
  basePath: "/toeic-practice",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
