import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    environmentMatchGlobs: [["tests/session.test.tsx", "jsdom"]],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: { reporter: ["text", "html"] },
  },
});
