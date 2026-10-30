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
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        // Hero card loop (components/MandateCard.tsx)
        heroShake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-7px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(3px)" },
        },
        heroDraw: {
          from: { strokeDashoffset: "26" },
          to: { strokeDashoffset: "0" },
        },
        heroDrain: {
          from: { transform: "scaleX(1)" },
          to: { transform: "scaleX(0)" },
        },
        heroPing: {
          "0%": { transform: "scale(.6)", opacity: ".55" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "modal-in": "modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in": "slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "hero-shake": "heroShake 450ms ease-in-out 1",
        "hero-draw": "heroDraw 500ms cubic-bezier(.65,0,.35,1) 120ms both",
        "hero-drain": "heroDrain 2300ms linear forwards",
        "hero-ping": "heroPing 650ms ease-out 1 forwards",
      },
    },
  },
  plugins: [],
};

export default config;
