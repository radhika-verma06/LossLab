import { describe, expect, it } from "vitest";
import { PROFILES } from "@/lib/data";

const expected = {
  skybridge: [312000, 226000, 184000, 159000, 71000, 61500, 50800, 42000, 38200, 30500, 24400, 19700, 14600, 10000],
  meridian: [260000, 180000, 136000, 112000, 82000, 58000, 42000, 22000],
  atlaspay: [720000, 490000, 365000, 280000, 180000, 125000, 90000, 51100],
} as const;

describe("synthetic scenario catalog", () => {
  it.each(Object.entries(expected))("has exact required seed values and 40 total cases for %s", (id, amounts) => {
    const profile = PROFILES[id]!;
    const violations = profile.scenarios.filter((scenario) => scenario.violatedRuleId !== null);
    expect(violations.map((scenario) => scenario.dollarCostCents)).toEqual(amounts);
    expect(profile.scenarios).toHaveLength(40);
    for (const scenario of profile.scenarios) {
      expect(scenario.name).not.toMatch(/placeholder|lorem|todo|sample case/i);
      expect(scenario.userMessage.length).toBeGreaterThan(30);
      expect(scenario.agentResponse.length).toBeGreaterThan(30);
      expect(scenario.explanatoryEvidence.length).toBeGreaterThan(30);
      expect(scenario.structuredToolTrace.length).toBeGreaterThan(0);
      expect(scenario.monthlyAffectedEvents * scenario.unitEconomicImpactCents).toBe(scenario.dollarCostCents);
    }
  });
});
