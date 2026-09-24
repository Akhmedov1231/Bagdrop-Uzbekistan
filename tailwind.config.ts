import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1b2a3a",
        "ink-soft": "#4a5a68",
        cream: "#fbf7f0",
        sand: "#f1e9d8",
        line: "rgba(27,42,58,0.13)",
        teal: { DEFAULT: "#1f6f6b", dark: "#144f4c", light: "#e4f0ee" },
        clay: { DEFAULT: "#e0883c", dark: "#b96b28" },
        ok: { DEFAULT: "#2f7a4f", bg: "#e7f3ea" },
        warn: { DEFAULT: "#a3701f", bg: "#faf0dc" },
      },
      fontFamily: {
        slab: ["'Zilla Slab'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
