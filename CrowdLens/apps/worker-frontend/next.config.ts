import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/photos/**",
      },
      {
        protocol: "https",
        hostname: "crowd-lens-mvp.s3.ap-south-1.amazonaws.com",
        port: "",
        pathname: "/user/**",
      },
    ],
  },
};

export default nextConfig;
