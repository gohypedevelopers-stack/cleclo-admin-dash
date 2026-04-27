import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Auth Service — dashboard, users, vendors, settlements, issues, wallet, referrals
      {
        source: "/api/admin/auth/:path*",
        destination: "http://localhost:3001/admin/:path*",
      },
      // Auth Service — public auth (login, OTP)
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },
      // Catalog Service — services, categories, items, banners, videos, campaigns
      {
        source: "/api/admin/catalog/:path*",
        destination: "http://localhost:3002/admin/:path*",
      },
      {
        source: "/api/catalog/:path*",
        destination: "http://localhost:3002/catalog/:path*",
      },
      // Order Service — orders
      {
        source: "/api/orders/:path*",
        destination: "http://localhost:3003/orders/:path*",
      },
      {
        source: "/api/admin/orders/:path*",
        destination: "http://localhost:3003/admin/orders/:path*",
      },
    ];
  },
};

export default nextConfig;
