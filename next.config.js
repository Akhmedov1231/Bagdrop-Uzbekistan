/** @type {import('next').NextConfig} */

// ============================================================
// Security Headers
//
// These headers protect against:
// - XSS (Content-Security-Policy, X-XSS-Protection)
// - Clickjacking (X-Frame-Options)
// - MIME-type sniffing (X-Content-Type-Options)
// - Protocol downgrade (Strict-Transport-Security)
// - Information leakage (Referrer-Policy, Permissions-Policy)
// ============================================================

const SUPABASE_PROJECT = "itgdmlephzbrsejrdrmew.supabase.co";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://${SUPABASE_PROJECT} https://*.tile.openstreetmap.org https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://${SUPABASE_PROJECT} wss://${SUPABASE_PROJECT} https://*.supabase.co;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  // DNS prefetching for performance
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // Force HTTPS for 2 years, including subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent clickjacking — deny embedding entirely
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Block MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Limit referrer information leakage
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Restrict browser features — disable unused APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
  // Content Security Policy — primary XSS defense
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  // Legacy XSS filter (for older browsers)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Remove "X-Powered-By: Next.js" header — prevents information disclosure
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Extra strict headers for API routes
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

