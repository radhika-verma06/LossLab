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
