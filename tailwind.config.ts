import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0f12",
        panel: "#10181d",
        elevated: "#142027",
        line: "#23363b",
        ink: "#e8f2f1",
        muted: "#738b90",
        cyan: "#37f0d0",
        alert: "#ff4545",
        amber: "#ffbf5b",
      },
      fontFamily: { sans: ["Inter", "Arial", "sans-serif"], mono: ["JetBrains Mono", "monospace"] },
      fontVariantNumeric: { tabular: "tabular-nums" },
    },
  },
  plugins: [],
};
export default config;
