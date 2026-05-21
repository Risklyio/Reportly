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
        topbar: "#1a3233",
        sidebar: "#011e1f",
        app: "#f2f1ed",
        primary: {
          DEFAULT: "#92fcdb",
          hover: "#7ae8c8",
          foreground: "#011e1f",
        },
        accent: "#92fcdb",
        surface: "#ffffff",
        muted: "#f2f1ed",
        border: "#d4d2cb",
        text: {
          DEFAULT: "#011e1f",
          muted: "#4a5c5d",
        },
        "on-dark": {
          DEFAULT: "#f2f1ed",
          muted: "#a8b8b9",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(1 30 31 / 0.06), 0 1px 2px -1px rgb(1 30 31 / 0.06)",
        elevated: "0 4px 6px -1px rgb(1 30 31 / 0.08), 0 2px 4px -2px rgb(1 30 31 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
