import { describe, expect, it } from "vitest";
import { PROFILES } from "@/lib/data";
import { evaluateScenario } from "@/lib/evaluator";
import { runRiskEngine } from "@/lib/risk-engine";
import { replayWithGuardrails } from "@/lib/remediation";
import { buildSimulationEvents } from "@/lib/simulation";

const expectedDollars = { skybridge: 12_437, meridian: 8_920, atlaspay: 23_011 } as const;

describe("seeded profiles and deterministic risk engine", () => {
  it.each(Object.entries(expectedDollars))("reconciles %s fixture economics", (profileId, dollars) => {
    const profile = PROFILES[profileId as keyof typeof PROFILES];
    const violations = profile.scenarios.filter((scenario) => scenario.violatedRuleId !== null);
    expect(violations).toHaveLength(profileId === "skybridge" ? 14 : 8);
    expect(violations.reduce((sum, scenario) => sum + scenario.monthlyAffectedEvents * scenario.unitEconomicImpactCents, 0)).toBe(dollars * 100);
    expect(violations.reduce((sum, scenario) => sum + scenario.dollarCostCents, 0)).toBe(dollars * 100);
  });

  it("derives a repeated-refund idempotency violation from structured actions", () => {
    const profile = PROFILES.skybridge;
    const scenario = profile.scenarios.find((item) => item.name === "Triple-refund loyalty exploit")!;
    const evaluation = evaluateScenario(scenario, []);
    expect(evaluation.passed).toBe(false);
    expect(evaluation.violations.map((item) => item.ruleId)).toContain("REFUND_IDEMPOTENCY");
    expect(evaluation.evidence).toContain("FL-88421");
  });

  it("blocks that exact trace when transaction idempotency is enabled", () => {
    const scenario = PROFILES.skybridge.scenarios.find((item) => item.name === "Triple-refund loyalty exploit")!;
    expect(evaluateScenario(scenario, []).passed).toBe(false);
    expect(evaluateScenario(scenario, ["transaction-idempotency"]).passed).toBe(true);
  });

  it("evaluates the lower-trust receipt instruction as a trust-boundary violation", () => {
    const scenario = PROFILES.skybridge.scenarios.find((item) => item.name === "Receipt prompt-injection")!;
    expect(evaluateScenario(scenario, []).violations.map((item) => item.ruleId)).toContain("UNTRUSTED_INSTRUCTION_SOURCE");
    expect(evaluateScenario(scenario, ["trusted-source-boundary"]).passed).toBe(true);
  });

  it("includes passing authored fixtures instead of treating every request as a failure", () => {
    for (const profile of Object.values(PROFILES)) {
      const passing = profile.scenarios.filter((scenario) => scenario.violatedRuleId === null);
      expect(passing.length).toBeGreaterThan(0);
      expect(passing.every((scenario) => evaluateScenario(scenario, []).passed)).toBe(true);
    }
  });

  it("uses a canonical 40-event result and category totals that sum exactly", () => {
    const result = runRiskEngine({ profileId: "skybridge" });
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.events).toHaveLength(40);
    expect(result.scenarios).toHaveLength(40);
    expect(result.monthlyExposureCents).toBe(1_243_700);
    expect(result.annualizedExposureCents).toBe(14_924_400);
    expect(Object.values(result.exposureByCategoryCents).reduce((sum, value) => sum + value, 0)).toBe(result.monthlyExposureCents);
    expect(result.violations).toBe(14);
    expect(result.passing).toBe(26);
  });

  it("replays the same structured traces under guardrails and reconciles integer cents", () => {
    const baseline = runRiskEngine({ profileId: "skybridge" });
    const comparison = replayWithGuardrails(baseline, [
      "transaction-idempotency", "trusted-source-boundary", "currency-conservation",
      "escalation-budget", "discount-stack-limit", "human-approval-gate",
    ]);
    expect(comparison.baseline.monthlyExposureCents).toBe(1_243_700);
    expect(comparison.remediated.monthlyExposureCents).toBeGreaterThanOrEqual(0);
    expect(comparison.preventedExposureCents + comparison.residualExposureCents).toBe(comparison.baseline.monthlyExposureCents);
    expect(comparison.preventedExposureCents).toBe(comparison.baseline.monthlyExposureCents - comparison.remediated.monthlyExposureCents);
    const tripleRefundId = baseline.scenarios.find((item) => item.name === "Triple-refund loyalty exploit")!.id;
    expect(comparison.affectedScenarioIds).toContain(tripleRefundId);
    expect(comparison.remediated.scenarios.find((item) => item.id === tripleRefundId)?.evaluation.passed).toBe(true);
  });

  it("reproduces identical results for identical profile and policy input", () => {
    const first = runRiskEngine({ profileId: "atlaspay", seed: 241 });
    const second = runRiskEngine({ profileId: "atlaspay", seed: 241 });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("scales event incidence and cents totals at alternate decision volumes", () => {
    const baseline = runRiskEngine({ profileId: "meridian", volumeMultiplier: 1 });
    const doubled = runRiskEngine({ profileId: "meridian", volumeMultiplier: 2 });
    expect(baseline.monthlyExposureCents).toBe(892_000);
    expect(doubled.monthlyExposureCents).toBe(1_784_000);
    expect(doubled.annualizedExposureCents).toBe(21_408_000);
    expect(doubled.assumptions.volumeScaling).toContain("nearest whole event");
  });

  it("keeps playback rate out of the evaluated event ordering and risk totals", () => {
    const result = runRiskEngine({ profileId: "skybridge" });
    const standard = buildSimulationEvents(result, 1);
    const accelerated = buildSimulationEvents(result, 4);
    expect(standard.map((event) => event.scenarioId)).toEqual(accelerated.map((event) => event.scenarioId));
    expect(standard.map((event) => event.exposureDeltaCents)).toEqual(accelerated.map((event) => event.exposureDeltaCents));
    expect(accelerated[0]!.offsetSeconds).toBe(standard[0]!.offsetSeconds);
  });
});
