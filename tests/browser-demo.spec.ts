import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3322";

const nav = (page: import("@playwright/test").Page, label: string) =>
  page.locator('nav[aria-label="Primary"] button', { hasText: label }).first().click();

test("refund safety demo: duplicate refunds are detected, safeguarded and retested", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => document.documentElement.dataset.losslabHydrated === "true");

  // Product frame and the default agent profile.
  await expect(page.getByRole("heading", { name: "Agent safety testing" })).toBeVisible();
  await expect(page.getByText("Find costly AI mistakes before deployment.")).toBeVisible();
  await expect(page.locator("#profile-selector")).toHaveValue("skybridge");
  await expect(page.getByTestId("demo-indicator")).toContainText("Synthetic demo");
  await expect(page.getByTestId("demo-indicator")).toContainText("Not connected to production agents");

  // The demonstration is the landing view — no navigation required.
  await expect(page.getByRole("heading", { name: "Refund safety test" })).toBeVisible();
  await expect(page.getByText("A customer requests multiple refunds for the same booking.")).toBeVisible();

  const timeline = page.getByTestId("demo-timeline").locator("li");
  await expect(timeline).toHaveCount(3);
  await expect(page.getByTestId("demo-timeline").locator('li[data-outcome="accepted"]')).toHaveCount(1);
  await expect(page.getByTestId("demo-timeline").locator('li[data-outcome="duplicate"]')).toHaveCount(2);
  await expect(page.getByText("Duplicate detected").first()).toBeVisible();

  // Results card reflects the evaluated trace.
  await expect(page.getByTestId("metric-attempts")).toHaveText("3");
  await expect(page.getByTestId("metric-unsafe")).toHaveText("2");
  await expect(page.getByTestId("metric-exposure")).toHaveText("$3,120");
  // The figure is a modeled MONTHLY number, and the label says so — never the cost of one test.
  await expect(page.getByTestId("metric-exposure-label")).toHaveText("Modeled monthly exposure");
  await expect(page.getByTestId("safeguard-state")).toHaveText("No safeguard");

  // The policy is explained in plain English and named.
  await expect(page.getByText("Policy violated")).toBeVisible();
  await expect(page.getByText("REFUND_IDEMPOTENCY").first()).toBeVisible();
  await expect(page.getByText(/refunded once/i).first()).toBeVisible();

  const beforeRunId = await page.getByTestId("run-id").textContent();

  // Safeguard + retest runs the real remediation engine.
  await page.getByTestId("apply-safeguard").click();
  await expect(page.getByTestId("safeguard-state")).toHaveText("Safeguard on");
  await expect(page.getByTestId("demo-timeline").locator('li[data-outcome="blocked"]')).toHaveCount(2);
  await expect(page.getByTestId("demo-timeline").locator('li[data-outcome="duplicate"]')).toHaveCount(0);
  await expect(page.getByTestId("demo-timeline").locator('li[data-outcome="accepted"]')).toHaveCount(1);
  await expect(page.getByText("Blocked by safeguard").first()).toBeVisible();

  // The same three actions, now with the unsafe ones stopped.
  await expect(page.getByTestId("metric-attempts")).toHaveText("3");
  await expect(page.getByTestId("metric-unsafe")).toHaveText("0");
  await expect(page.getByTestId("metric-exposure")).toHaveText("$0");

  await expect(page.getByTestId("before-exposure")).toHaveText("$3,120.00");
  await expect(page.getByTestId("after-exposure")).toHaveText("$0.00");
  await expect(page.getByTestId("prevented")).toContainText("$3,120.00");
  await expect(page.getByTestId("run-id")).not.toHaveText(beforeRunId ?? "");

  // The original Critical risk and the successful mitigated replay are labelled as distinct states.
  await expect(page.getByText("Original risk", { exact: true })).toBeVisible();
  await expect(page.getByText("Original run", { exact: true })).toBeVisible();
  await expect(page.getByText("Mitigated replay", { exact: true })).toBeVisible();
  await expect(page.getByText("Mitigated replay passed", { exact: true })).toBeVisible();
  await expect(page.getByText("at risk · Critical severity")).toBeVisible();
  await expect(page.getByText("at risk · replay passed")).toBeVisible();

  // Reset restores the unfixed state so the demo can be replayed.
  await page.getByTestId("reset-test").click();
  await expect(page.getByTestId("safeguard-state")).toHaveText("No safeguard");
  await expect(page.getByTestId("metric-unsafe")).toHaveText("2");

  expect(errors).toEqual([]);
});

test("run tests, reports and integrations all read the same evaluated run", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => document.documentElement.dataset.losslabHydrated === "true");

  // RUN TESTS — the suite executes and is deterministic on repeat.
  await nav(page, "Run tests");
  await expect(page.getByRole("heading", { name: "Red-team suite" })).toBeVisible();
  const runId = await page.getByTestId("run-id").textContent();
  await page.getByTestId("run-suite").click();
  await expect(page.getByText(/reproduced the identical run ID/)).toBeVisible();
  await expect(page.getByTestId("run-id")).toHaveText(runId ?? "");

  const allTraces = page.getByTestId("trace-list").locator("li");
  await expect(allTraces).toHaveCount(40);
  await page.getByRole("button", { name: "Failing" }).click();
  await expect(allTraces).toHaveCount(14);
  await page.getByRole("button", { name: "Passing" }).click();
  await expect(allTraces).toHaveCount(26);
  await page.getByRole("button", { name: "All traces" }).click();

  // REPORTS — figures reconcile, safeguards replay, export downloads.
  await nav(page, "Reports");
  await expect(page.getByRole("heading", { name: "Exposure report" })).toBeVisible();
  await expect(page.getByTestId("report-baseline")).toHaveText("$12,437");
  await expect(page.getByTestId("report-prevented")).toHaveText("$0");
  await expect(page.getByTestId("report-reduction")).toHaveText("0.00%");
  await expect(page.getByTestId("reconciliation")).toContainText("Baseline $12,437.00");

  await page.getByRole("checkbox", { name: /Transaction idempotency/ }).check();
  await expect(page.getByTestId("report-prevented")).toHaveText("$3,648");
  await expect(page.getByTestId("report-residual")).toHaveText("$8,789");
  await expect(page.getByTestId("reconciliation")).toContainText("prevented $3,648.00");
  await expect(page.getByTestId("report-reduction")).toHaveText("29.33%");

  // The full proposed suite button replays the same traces under all five controls.
  await page.getByTestId("apply-suite").click();
  await expect(page.getByTestId("report-prevented")).toHaveText("$9,696");
  await expect(page.getByTestId("report-residual")).toHaveText("$2,741");
  await expect(page.getByTestId("report-reduction")).toHaveText("77.96%");
  await expect(page.getByTestId("reconciliation")).toContainText("Baseline $12,437.00");
  await expect(page.getByTestId("reconciliation")).toContainText("residual $2,741.00");

  // Clearing the suite restores the unguarded baseline, then re-select idempotency so the
  // session-wide persistence check further down still has a control to carry across screens.
  await page.getByTestId("apply-suite").click();
  await expect(page.getByTestId("report-prevented")).toHaveText("$0");
  await expect(page.getByTestId("report-reduction")).toHaveText("0.00%");
  await page.getByRole("checkbox", { name: /Transaction idempotency/ }).check();
  await expect(page.getByTestId("report-prevented")).toHaveText("$3,648");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-report").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/exposure-report\.json$/);

  // INTEGRATIONS — the documented route really answers.
  await nav(page, "Integrations");
  await expect(page.getByRole("heading", { name: "Integrate LossLab" })).toBeVisible();
  await expect(page.getByText("losslab.run")).toBeVisible();
  const agents = await page.request.get(`${BASE}/api/v1/agents`);
  expect(agents.ok()).toBe(true);
  expect((await agents.json()).data).toHaveLength(3);

  // Switching profile re-derives every screen from the new profile.
  await nav(page, "Overview");
  await page.locator("#profile-selector").selectOption("atlaspay");
  await expect(page.locator("#profile-selector")).toHaveValue("atlaspay");
  await expect(page.getByTestId("active-profile")).toContainText("AtlasPay");
  await expect(page.getByTestId("metric-attempts")).not.toHaveText("0");

  // The safeguard chosen on Reports is session-wide, so the overview reflects it too.
  await page.locator("#profile-selector").selectOption("skybridge");
  await expect(page.getByTestId("safeguard-state")).toHaveText("Safeguard on");
  await expect(page.getByTestId("metric-exposure")).toHaveText("$0");
  await page.getByTestId("reset-test").click();
  await expect(page.getByTestId("metric-exposure")).toHaveText("$3,120");

  expect(errors).toEqual([]);
});
