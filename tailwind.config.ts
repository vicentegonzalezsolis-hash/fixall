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
        bg: "#0B0D14",
        surface: "#12141F",
        "surface-2": "#1A1D2E",
        border: "rgba(255,255,255,0.07)",
        primary: "#1A6BFF",
        "primary-dim": "rgba(26,107,255,0.15)",
        success: "#00D68F",
        "success-dim": "rgba(0,214,143,0.15)",
        warning: "#FFB020",
        "warning-dim": "rgba(255,176,32,0.15)",
        danger: "#FF4757",
        "danger-dim": "rgba(255,71,87,0.15)",
        "text-primary": "#FFFFFF",
        "text-secondary": "rgba(255,255,255,0.55)",
        "text-muted": "rgba(255,255,255,0.3)",
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
