import { expect, test } from "@playwright/test";

test("judge flow evaluates a trace, blocks it on replay, reports and exports consistent results", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3322/");
  await expect(page.getByText("DEMO MODE — SYNTHETIC TEST FIXTURES").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /TEST AUTONOMY/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SkyBridge Airways" })).toBeVisible();
  await expect(page.getByText("$12,437").first()).toBeVisible();

  await page.waitForFunction(() => document.documentElement.dataset.losslabHydrated === "true");
  await page.getByRole("button", { name: /RUN RED-TEAM SUITE/ }).click();
  await expect(page.getByRole("heading", { name: "RUN CONTROL" })).toBeVisible();
  await expect(page.getByText("EVALUATED ACTION FEED")).toBeVisible();
  await page.getByRole("button", { name: /1×/ }).click();
  await page.getByRole("button", { name: /COMPLETE NOW/ }).click();
  await expect(page.getByText("SIMULATION COMPLETE").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /CASE 001 Triple-refund loyalty exploit/ })).toBeVisible();
  await page.getByRole("log", { name: "Evaluated action results" }).getByRole("button", { name: /CASE 001.*Triple-refund loyalty exploit/ }).click();
  await expect(page.getByRole("heading", { name: "Triple-refund loyalty exploit" })).toBeVisible();
  await expect(page.getByText("REFUND_IDEMPOTENCY", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/FL-88421/).first()).toBeVisible();
  await expect(page.getByText(/refund-2/).first()).toBeVisible();

  await page.getByRole("button", { name: /APPLY PROPOSED SUITE/ }).click();
  await page.getByRole("button", { name: /OPEN EXPOSURE REPORT/ }).click();
  await expect(page.getByRole("heading", { name: "EXPOSURE REPORT" })).toBeVisible();
  await expect(page.getByTestId("baseline-exposure")).toHaveText("$12,437.00");
  await expect(page.getByText("MODELED REDUCTION UNDER ASSUMED GUARDRAIL EFFICACY")).toBeVisible();
  await expect(page.getByTestId("residual-exposure")).toHaveText("$2,741.00");
  expect(await page.getByText("−$9,696.00").count()).toBe(1);
  await page.getByRole("slider", { name: /Decision volume/ }).fill("1.5");
  await expect(page.getByTestId("sensitivity-monthly")).toHaveText("$4,263.00");
  await page.getByRole("slider", { name: /Decision volume/ }).fill("1");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /EXPORT REPORT/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/synthetic-risk-report\.json$/);

  const meridian = page.locator("select#sidebar-agent");
  await meridian.selectOption("meridian");
  await expect(page.getByTestId("baseline-exposure")).toHaveText("$8,920.00");
  await page.locator("select#sidebar-agent").selectOption("atlaspay");
  await expect(page.getByTestId("baseline-exposure")).toHaveText("$23,011.00");
  await page.getByRole("button", { name: /Integrate/ }).click();
  await expect(page.getByRole("heading", { name: "INTEGRATE" })).toBeVisible();
  const sdkClipboard = page.getByRole("button", { name: /COPY SDK/ });
  await sdkClipboard.click();
  await expect(page.getByText("COPIED", { exact: true })).toBeVisible();

  const agents = await page.request.get("http://127.0.0.1:3322/api/v1/agents");
  expect(agents.ok()).toBe(true);
  expect((await agents.json()).data).toHaveLength(3);
  expect(errors).toEqual([]);
});

test("airline refund demo detects duplicate refunds, applies idempotency, and reconciles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3322/");
  await page.waitForFunction(() => document.documentElement.dataset.losslabHydrated === "true");

  // STEP 1 — select the airline refund agent.
  const airline = page.getByRole("button", { name: /PROFILE \/ 01/ });
  await airline.click();
  await expect(airline).toHaveAttribute("aria-pressed", "true");
  await expect(airline).toContainText("SkyBridge Airways");
  await expect(airline).toContainText("Avery · Refund Resolution Agent");
  await expect(airline).toContainText("$12,437");

  // STEP 2 — run the simulated suite.
  await page.getByRole("button", { name: /RUN RED-TEAM SUITE/ }).click();
  await expect(page.getByRole("heading", { name: "RUN CONTROL" })).toBeVisible();
  await page.getByRole("button", { name: /COMPLETE NOW/ }).click();
  await expect(page.getByText("SIMULATION COMPLETE").first()).toBeVisible();
  await expect(page.getByText("14 VIOLATIONS / 40 TRACES")).toBeVisible();

  // STEP 3 — detect the duplicate refunds.
  const feed = page.getByRole("log", { name: "Evaluated action results" });
  await feed.getByRole("button", { name: /CASE 001/ }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: "Triple-refund loyalty exploit" })).toBeVisible();
  await expect(drawer).toContainText("REFUND_APPROVAL_THRESHOLD");
  await expect(drawer).toContainText("REFUND_IDEMPOTENCY");
  await expect(drawer).toContainText("POLICY VIOLATION IDENTIFIED");
  await expect(drawer).toContainText("Three issueRefund calls target FL-88421");
  await expect(drawer).toContainText("$3,120.00");

  // STEP 4 — inspect the supporting evidence and capture the evaluated trace.
  const tracePanel = drawer.locator("pre");
  await expect(tracePanel).toContainText("refund-1");
  await expect(tracePanel).toContainText("refund-2");
  await expect(tracePanel).toContainText("refund-3");
  await expect(tracePanel).toContainText("FL-88421");
  await expect(drawer).toContainText("AGENT RESPONSE");
  const traceBefore = (await tracePanel.textContent()) ?? "";
  expect(traceBefore.length).toBeGreaterThan(0);

  // STEP 5 — apply the idempotency safeguard only.
  await page.locator('nav[aria-label="Primary"] button', { hasText: "Report" }).first().click();
  await expect(page.getByRole("heading", { name: "EXPOSURE REPORT" })).toBeVisible();
  await expect(page.getByTestId("baseline-exposure")).toHaveText("$12,437.00");
  await expect(page.getByTestId("residual-exposure")).toHaveText("$12,437.00");
  await page.getByRole("checkbox", { name: /Transaction idempotency/ }).check();
  await expect(page.getByTestId("residual-exposure")).toHaveText("$8,789.00");
  await expect(page.getByText("−$3,648.00")).toBeVisible();

  // STEP 6 — rerun the identical traces: baseline is unchanged, the replay count changes instead.
  await expect(page.getByTestId("baseline-exposure")).toHaveText("$12,437.00");
  await expect(page.getByText("REPLAY RESULT / 11 VIOLATIONS / 29 PASSES")).toBeVisible();
  await expect(page.getByText("INTERCEPTED CASES (3)")).toBeVisible();

  // STEP 7 — confirm the extra refunds are now blocked on the replay.
  await page.getByRole("button", { name: /Triple-refund loyalty exploit/ }).last().click();
  const blockedDrawer = page.getByRole("dialog");
  await expect(blockedDrawer).toContainText("PROPOSED ACTION BLOCKED");
  await expect(blockedDrawer).toContainText("Guardrail intercepted the unsafe effect before execution.");
  await expect(blockedDrawer).toContainText("$0.00");
  expect(await blockedDrawer.locator("pre").textContent()).toBe(traceBefore);

  // STEP 8 — confirm the financial calculations reconcile.
  const money = async (testId: string) => Number((await page.getByTestId(testId).textContent())!.replace(/[^0-9.]/g, ""));
  const baseline = await money("baseline-exposure");
  const residual = await money("residual-exposure");
  const prevented = Number((await page.getByText("−$3,648.00").textContent())!.replace(/[^0-9.]/g, ""));
  expect(baseline).toBe(12437);
  expect(prevented + residual).toBe(baseline);
  expect(await page.getByTestId("sensitivity-monthly")).toHaveText("$8,789.00");

  // The same intercepted finding stays reachable from the run screen's finding drawer.
  await page.locator('nav[aria-label="Primary"] button', { hasText: "Run" }).first().click();
  await expect(page.getByRole("heading", { name: "RUN CONTROL" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("PROPOSED ACTION BLOCKED");
  expect(errors).toEqual([]);
});
