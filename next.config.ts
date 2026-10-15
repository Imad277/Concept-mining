import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Former English slugs from Phase 1.
    return [
      { source: "/calculator", destination: "/simulation", permanent: true },
      { source: "/methodology", destination: "/methodik", permanent: true },
      { source: "/faq", destination: "/wissen", permanent: true },
      { source: "/imprint", destination: "/impressum", permanent: true },
      { source: "/privacy", destination: "/datenschutz", permanent: true },
      { source: "/risk-disclosure", destination: "/risikohinweise", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
