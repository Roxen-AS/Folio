import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2F3EF",
        ink: "#16212B",
        rule: "#D9DAD3",
        ledger: {
          green: "#2F6E52",
          "green-bg": "#E4EEE7",
          amber: "#A96A1F",
          "amber-bg": "#F3E7D4",
          slate: "#5B6570",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "IBM Plex Mono",
          "Roboto Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
