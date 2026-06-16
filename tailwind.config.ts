import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        topbar: "var(--topbar)",
        sidebar: "var(--sidebar)",
        app: "var(--app)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        accent: "var(--primary)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        border: "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        "on-dark": {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated:
          "0 4px 6px -1px rgb(6 6 6 / 0.06), 0 2px 4px -2px rgb(6 6 6 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
