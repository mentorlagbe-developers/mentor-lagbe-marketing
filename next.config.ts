import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboards/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
