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
        topbar: "#060606",
        sidebar: "#060606",
        app: "#fcfcfc",
        primary: {
          DEFAULT: "#060606",
          hover: "#1a1a1a",
          foreground: "#fcfcfc",
        },
        accent: "#060606",
        surface: "#ffffff",
        muted: "#f7f7f7",
        border: "#f7f7f7",
        text: {
          DEFAULT: "#060606",
          muted: "#6b7280",
        },
        "on-dark": {
          DEFAULT: "#fcfcfc",
          muted: "#a1a1aa",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(6 6 6 / 0.04), 0 1px 2px -1px rgb(6 6 6 / 0.03)",
        elevated: "0 4px 6px -1px rgb(6 6 6 / 0.06), 0 2px 4px -2px rgb(6 6 6 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
