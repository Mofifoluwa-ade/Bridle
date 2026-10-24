import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core Brand Tokens (From official Bridle brand guide)
        ink: "#0E1116",
        paper: "#F6F7F9",
        white: "#FFFFFF",

        // Neutrals
        mute: "#5B6470",
        haze: "#7A8494",
        rule: "#C9CFD8",
        line: "#E3E6EB",
        night: "#2A313C",
        dim: "#A3ABB8",
        soft: "#C4CAD4",
        faint: "#8A93A3",

        // Accent & Status
        emerald: {
          DEFAULT: "#0A7C59",
          dark: "#46D9A4", // Emerald on dark (Accent on Ink)
          tint: "#E7F2EE",
        },
        alert: {
          DEFAULT: "#B42318",
          tint: "#FDECEA",
        },
        caution: {
          DEFAULT: "#B54708",
          tint: "#FEF3E2",
        },

        // Functional aliases
        accent: "#0A7C59",
        "accent-dark": "#46D9A4",
        "accent-tint": "#E7F2EE",
        "accent-glow": "rgba(10, 124, 89, 0.25)",
        bad: "#B42318",
        "bad-tint": "#FDECEA",
        warn: "#B54708",
        "warn-tint": "#FEF3E2",

        // Dark theme tokens for the app surface
        dark: {
          bg: "#0B0E14",
          card: "#12161F",
          "card-hover": "#171D28",
          border: "#1E2532",
          subtle: "#181F2C",
          text: "#F6F7F9",
          mute: "#828D9F",
          dim: "#A3ABB8",
          soft: "#C4CAD4",
          faint: "#8A93A3",
          night: "#2A313C",
          accent: "#46D9A4", // Emerald on dark!
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Instrument Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        display: "-0.04em",
        heading: "-0.03em",
        subhead: "-0.02em",
        label: "0.12em",
      },
      maxWidth: {
        page: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
