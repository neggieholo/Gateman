import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://10.114.205.113:3005",
    "http://localhost:3005",
    "10.114.205.113",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3003/api/:path*",
      },
    ];
  },
};

export default nextConfig;
