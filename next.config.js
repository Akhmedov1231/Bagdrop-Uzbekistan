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

const SUPABASE_PROJECT = "itgdmlephzbrsejdrmew.supabase.co";

// ============================================================
// Public Supabase key guard
//
// NEXT_PUBLIC_SUPABASE_ANON_KEY is inlined into public JavaScript (see
// src/lib/env.ts). If the service-role or a secret key were ever pasted into
// it, the build would publish a key that bypasses Row Level Security. Refuse
// to build instead; a failed build leaves the current deployment running.
// ============================================================

function assertPublicSupabaseKey(key) {
  if (!key) return;

  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY holds a secret key (sb_secret_...). Use the anon / publishable key."
    );
  }

  const payload = key.split(".")[1];
  if (!payload) return; // sb_publishable_... keys are not JWTs

  let role;
  try {
    role = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role;
  } catch {
    return;
  }

  if (role && role !== "anon") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_ANON_KEY is a "${role}" key. It is published to every visitor; use the anon key.`
    );
  }
}

assertPublicSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

// NOTE on the two openstreetmap entries below: they are not redundant.
// A CSP host-source of `*.tile.openstreetmap.org` matches SUBDOMAINS ONLY — it
// does not match the bare host. RealMap requests
// https://tile.openstreetmap.org/{z}/{x}/{y}.png (OSM's current form, no
// subdomain), so with only the wildcard every tile was blocked and the map
// rendered as a plain grey box: the pins and the attribution still drew,
// because neither is an image. Keep both entries — the wildcard covers the
// older a./b./c. hosts if the URL is ever changed back.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://${SUPABASE_PROJECT} https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://unpkg.com;
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
    // camera=(self): the partner portal scans customer QR codes with the
    // device camera (html5-qrcode). An empty allowlist blocked getUserMedia,
    // and check-in/check-out require a scan.
    value: "camera=(self), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
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

