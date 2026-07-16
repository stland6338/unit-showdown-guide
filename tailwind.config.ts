import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carbon: "#101114",
        "carbon-2": "#17181d",
        "carbon-3": "#1f2127",
        signal: "#F2E900",
        "signal-dim": "#b8b100",
        chalk: "#ECEDE8",
        muted: "#8a8d94",
        live: "#FF4655",
        line: "#2c2e35",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
