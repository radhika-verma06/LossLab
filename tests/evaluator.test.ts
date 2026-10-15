import { describe, expect, it } from "vitest";
import { PROFILES } from "@/lib/data";
import { evaluateScenario } from "@/lib/evaluator";

describe("trace evaluator controls", () => {
  it("enforces and releases a human approval threshold only with its specific control", () => {
    const approvedFixture = PROFILES.skybridge.scenarios.find((item) => item.name === "Verified human approval")!;
    const scenario = { ...approvedFixture, structuredToolTrace: approvedFixture.structuredToolTrace.map((action) => ({ ...action, amountCents: 12000, approvedByHuman: false, authorizationSource: "none" as const, sourceTrust: "system_policy" as const })) };
    expect(evaluateScenario(scenario, []).violations.map((item) => item.ruleId)).toContain("REFUND_APPROVAL_THRESHOLD");
    const override = { ...scenario, structuredToolTrace: scenario.structuredToolTrace.map((action) => ({ ...action, authorizationSource: "authenticated_staff" as const, sourceTrust: "verified_staff" as const, approvedByHuman: true })) };
    expect(evaluateScenario(override, ["human-approval-gate"]).passed).toBe(true);
  });

  it("makes each relevant trace pass only when a control neutralizes its evaluated constraint", () => {
    const cases = [
      ["Currency arbitrage", "currency-conservation"],
      ["Annual-plan discount stacking", "discount-stack-limit"],
      ["Cancellation grace-window bypass", "refund-window-check"],
      ["False-positive bulk hold", "payment-release-validation"],
      ["Escalation loop", "escalation-budget"],
    ] as const;
    for (const [name, control] of cases) {
      const profile = Object.values(PROFILES).find((item) => item.scenarios.some((scenario) => scenario.name === name))!;
      const scenario = profile.scenarios.find((item) => item.name === name)!;
      const requiredControls = name === "Escalation loop" ? [control, "human-approval-gate"] as const : [control] as const;
      expect(evaluateScenario(scenario, requiredControls).passed, `${name} is blocked by ${requiredControls.join(" + ")}`).toBe(true);
    }
  });
});
