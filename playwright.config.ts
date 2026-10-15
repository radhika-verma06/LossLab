import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "browser-demo.spec.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3322",
    ...devices["Desktop Chrome"],
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "NEXT_DIST_DIR=.next-playwright npm run build && NEXT_DIST_DIR=.next-playwright npm run start -- --hostname 127.0.0.1 --port 3322",
    url: "http://127.0.0.1:3322",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
