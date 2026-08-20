import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F3EC",
        "paper-dim": "#EDEAE0",
        ink: "#2B2A28",
        "ink-soft": "#5A574F",
        dusk: {
          near: "#7C89A8",
          mid: "#4E5A82",
          far: "#2E2C56",
          deep: "#1C1A38",
        },
        seal: "#A9793F",
        "seal-dark": "#8A5F2E",
        line: "#DCD7C8",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-newsreader)", "Georgia", "serif"],
        ui: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        seal: "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(169,121,63,0.15)",
        card: "0 1px 3px rgba(43,42,40,0.06), 0 1px 2px rgba(43,42,40,0.04)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        breathe: "breathe 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
