import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1116",
        paper: "#F6F7F9",
        mute: "#5B6470",
        dim: "#A3ABB8",
        line: "#E3E6EB",
        rule: "#C9CFD8",
        night: "#2A313C",
        // Single accent. Swap the hex to re-theme the whole page.
        accent: "#0A7C59",
        "accent-tint": "rgba(10, 124, 89, 0.1)",
        bad: "#B42318",
        "bad-tint": "#FDECEA",
        warn: "#B54708",
        "warn-tint": "#FEF3E2",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        display: "-0.04em",
        heading: "-0.03em",
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
