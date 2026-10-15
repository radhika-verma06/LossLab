import { defineConfig, devices } from "@playwright/test";

/**
 * Local runs build and serve the app themselves. Setting `LOSSLAB_BASE_URL` points the same suite
 * at an already-running deployment — for example the public HTTPS URL — and skips the local server,
 * so the identical assertions cover the deployed application:
 *
 *   LOSSLAB_BASE_URL=https://<project>.vercel.app npx playwright test
 */
const baseURL = process.env.LOSSLAB_BASE_URL ?? "http://127.0.0.1:3322";
const isLocal = !process.env.LOSSLAB_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "browser-demo.spec.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  ...(isLocal
    ? {
        webServer: {
          command: "NEXT_DIST_DIR=.next-playwright npm run build && NEXT_DIST_DIR=.next-playwright npm run start -- --hostname 127.0.0.1 --port 3322",
          url: "http://127.0.0.1:3322",
          reuseExistingServer: false,
          timeout: 180_000,
        },
      }
    : {}),
});
