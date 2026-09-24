/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: "output: export" was removed. This is now a real full-stack app
  // (Supabase-backed server actions/route handlers), which static export
  // cannot support. Deploy as a normal Next.js server (Vercel, Node host).
};

module.exports = nextConfig;
