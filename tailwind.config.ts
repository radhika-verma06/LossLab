import type { Config } from "tailwindcss";

const config: Config = {
  // `lib/` must be scanned too: helpers such as severityClass() return Tailwind class strings,
  // and any class that is only referenced there is otherwise purged from the compiled CSS.
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F7F5",
        surface: "#FFFFFF",
        ink: "#17252B",
        subtle: "#69777C",
        primary: "#176B66",
        "primary-soft": "#E8F1F0",
        success: "#258579",
        "success-soft": "#E6F1EF",
        danger: "#C7534B",
        "danger-soft": "#FBEDEC",
        line: "#E3E8E6",
        "line-strong": "#CFD8D5",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,37,43,.04), 0 1px 3px rgba(23,37,43,.06)",
        raised: "0 2px 4px rgba(23,37,43,.05), 0 8px 20px -8px rgba(23,37,43,.10)",
      },
      transitionDuration: { 200: "200ms", 250: "250ms" },
    },
  },
  plugins: [],
};
export default config;
