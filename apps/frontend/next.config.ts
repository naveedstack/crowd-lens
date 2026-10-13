import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["crowdlens-idl"],
  async redirects() {
    return [
      { source: "/voter", destination: "/validators/votes", permanent: false },
      { source: "/voter/task/:taskId", destination: "/validators/task/:taskId", permanent: false },
      { source: "/voter/history", destination: "/validators/history", permanent: false },
      { source: "/voter/earnings", destination: "/validators/earnings", permanent: false },
    ];
  },
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
