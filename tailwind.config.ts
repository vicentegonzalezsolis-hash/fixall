import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#FAFAFA",
        bg: "#0D0D0D",
        surface: "#111827",
        "surface-2": "#111827",
        border: "#1a2a3a",
        primary: "#1E466B",
        "primary-dim": "rgba(30,70,107,0.25)",
        accent: "#67BAF4",
        "accent-dim": "rgba(103,186,244,0.15)",
        success: "#10B981",
        "success-dim": "rgba(16,185,129,0.15)",
        warning: "#F59E0B",
        "warning-dim": "rgba(245,158,11,0.15)",
        danger: "#EF4444",
        "danger-dim": "rgba(239,68,68,0.15)",
        "text-primary": "#FAFAFA",
        "text-secondary": "#555555",
        "text-muted": "#555555",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      maxWidth: {
        mobile: "430px",
      },
    },
  },
  plugins: [],
};

export default config;
