import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress all responses
  compress: true,

  // Aggressive image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },

  // Aggressive HTTP headers for caching & performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Fonts cached long-term
        source: "/fonts/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },


  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
