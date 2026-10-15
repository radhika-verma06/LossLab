import { describe, expect, it } from "vitest";
import { PROFILES } from "@/lib/data";
import { runRiskEngine } from "@/lib/risk-engine";
import { replayWithGuardrails } from "@/lib/remediation";
import type { ProfileId } from "@/lib/types";

const totals: Record<ProfileId, number> = { skybridge: 1243700, meridian: 892000, atlaspay: 2301100 };

describe("LossLab hackathon acceptance", () => {
  it.each(Object.entries(totals))("holds the disclosed baseline and correct suite size for %s", (id, cents) => {
    const result = runRiskEngine({ profileId: id as ProfileId });
    expect(result.baselineMonthlyExposureCents).toBe(cents);
    expect(result.events).toHaveLength(40);
    expect(result.assumptions.mode).toBe("DEMO MODE — SYNTHETIC TEST FIXTURES");
  });
  it("reveals, blocks, and recalculates the exact unsafe triple refund trace", () => {
    const baseline = runRiskEngine({ profileId: "skybridge" });
    const scenario = baseline.scenarios.find((item) => item.name === "Triple-refund loyalty exploit")!;
    expect(scenario.evaluation.passed).toBe(false);
    expect(scenario.evaluation.violations.map((violation) => violation.ruleId)).toContain("REFUND_IDEMPOTENCY");
    expect(scenario.evaluation.evaluatedActions).toHaveLength(3);
    expect(scenario.structuredToolTrace.map((action) => action.businessEventId)).toEqual(["FL-88421", "FL-88421", "FL-88421"]);
    const replay = replayWithGuardrails(baseline, ["transaction-idempotency"]);
    const reevaluated = replay.remediated.scenarios.find((item) => item.id === scenario.id)!;
    expect(reevaluated.evaluation.passed).toBe(true);
    expect(reevaluated.evaluation.blockedActionIds.length).toBeGreaterThan(0);
    expect(reevaluated.evaluation.evaluatedActions).toEqual(scenario.evaluation.evaluatedActions);
    expect(replay.preventedExposureCents + replay.residualExposureCents).toBe(replay.baselineExposureCents);
    expect(replay.preventedExposureCents).toBeGreaterThan(0);
  });
  it("preserves the authored scenario totals with no silent calibration", () => {
    for (const profile of Object.values(PROFILES)) {
      const scenarioTotal = profile.scenarios.filter((item) => item.violatedRuleId !== null).reduce((sum, item) => sum + item.dollarCostCents, 0);
      expect(profile.monthlyExposureCents).toBeGreaterThanOrEqual(scenarioTotal);
      expect(profile.monthlyExposureCents - scenarioTotal).toBe(0);
    }
  });
});
