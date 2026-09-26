import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f172a",
          deep: "#090d16",
          soft: "#475569",
          muted: "#64748b",
          light: "#94a3b8",
        },
        cream: {
          DEFAULT: "#fdfbf7",
          50: "#fffefc",
          100: "#faf6ed",
          200: "#f4ede0",
          soft: "#f8f6f0",
        },
        sand: {
          DEFAULT: "#f4eee0",
          dark: "#e8deca",
        },
        line: "rgba(15, 23, 42, 0.08)",
        "line-dark": "rgba(255, 255, 255, 0.12)",
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        teal: {
          DEFAULT: "#0d9488",
          dark: "#0f766e",
          light: "#f0fdfa",
          border: "#99f6e4",
          glow: "#14b8a6",
        },
        clay: {
          DEFAULT: "#ea580c",
          dark: "#c2410c",
          light: "#fff7ed",
          border: "#fed7aa",
          glow: "#f97316",
        },
        ok: {
          DEFAULT: "#10b981",
          dark: "#059669",
          bg: "#ecfdf5",
          border: "#a7f3d0",
        },
        warn: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          bg: "#fffbeb",
          border: "#fde68a",
        },
        danger: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          bg: "#fef2f2",
        }
      },
      fontFamily: {
        display: ["'Outfit'", "'Plus Jakarta Sans'", "sans-serif"],
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        slab: ["'Outfit'", "'Zilla Slab'", "Georgia", "serif"],
      },
      boxShadow: {
        "glow-brand": "0 0 30px -5px rgba(234, 88, 12, 0.35)",
        "glow-teal": "0 0 30px -5px rgba(13, 148, 136, 0.35)",
        "card-modern": "0 10px 30px -5px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 20px 40px -12px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(15, 23, 42, 0.08)",
        "glass": "0 8px 32px 0 rgba(15, 23, 42, 0.06)",
        "ticket": "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-pattern": "radial-gradient(at 40% 20%, rgba(249, 115, 22, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(13, 148, 136, 0.10) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(249, 115, 22, 0.08) 0px, transparent 50%)",
        "mesh-dark": "radial-gradient(at 40% 20%, rgba(249, 115, 22, 0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(13, 148, 136, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(249, 115, 22, 0.12) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
