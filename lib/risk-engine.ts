import { getProfile } from "./data";
import { evaluateScenario } from "./evaluator";
import type { AgentProfile, GuardrailId, ProfileId, RunResult, ScenarioCategory, Severity } from "./types";

const CATEGORIES: readonly ScenarioCategory[] = ["Policy Breach", "Prompt Injection", "Economic Manipulation", "Escalation Loop"];
const SEVERITIES: readonly Severity[] = ["Low", "Medium", "High", "Critical"];

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function stableRunId(profileId: string, seed: number, volume: number, guardrails: readonly string[]): string {
  const raw = `${profileId}|${seed}|${volume.toFixed(4)}|${[...guardrails].sort().join(",")}`;
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) hash = Math.imul(hash ^ raw.charCodeAt(index), 16777619);
  return `LL-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

function assertVolume(value: number): void {
  if (!Number.isFinite(value) || value < 0.5 || value > 2) {
    throw new RangeError("Decision-volume multiplier must be between 0.5× and 2.0×.");
  }
}

export function runRiskEngine(options: {
  readonly profileId: ProfileId;
  readonly seed?: number;
  readonly volumeMultiplier?: number;
  readonly guardrails?: readonly GuardrailId[];
  readonly profile?: AgentProfile;
}): Readonly<RunResult> {
  const seed = options.seed ?? 241;
  const volumeMultiplier = options.volumeMultiplier ?? 1;
  assertVolume(volumeMultiplier);
  if (!Number.isSafeInteger(seed) || seed < 0) throw new RangeError("Simulation seed must be a non-negative safe integer.");
  const profile = options.profile ?? getProfile(options.profileId);
  if (profile.id !== options.profileId) throw new RangeError("The selected profile ID does not match its profile data.");
  const guardrails = Object.freeze([...new Set(options.guardrails ?? [])].sort());

  const scenarios = profile.scenarios.map((fixture) => {
    const evaluation = evaluateScenario(fixture, guardrails);
    const scaledEvents = Math.floor(fixture.monthlyAffectedEvents * volumeMultiplier + 0.5);
    const modeledExposureCents = evaluation.passed ? 0 : scaledEvents * fixture.unitEconomicImpactCents;
    return {
      ...fixture,
      evaluation,
      monthlyAffectedEvents: scaledEvents,
      dollarCostCents: scaledEvents * fixture.unitEconomicImpactCents,
      modeledExposureCents,
    };
  });

  const exposureByCategoryCents = Object.fromEntries(CATEGORIES.map((category) => [
    category,
    scenarios.reduce((total, scenario) => total + (scenario.evaluation.passed || scenario.category !== category ? 0 : scenario.modeledExposureCents), 0),
  ])) as Record<ScenarioCategory, number>;
  const severityCounts = Object.fromEntries(SEVERITIES.map((severity) => [
    severity,
    scenarios.filter((scenario) => !scenario.evaluation.passed && scenario.severity === severity).length,
  ])) as Record<Severity, number>;
  const monthlyExposureCents = Object.values(exposureByCategoryCents).reduce((total, cents) => total + cents, 0);
  const baselineMonthlyExposureCents = profile.scenarios.reduce((total, scenario) => {
    const scaledEvents = Math.floor(scenario.monthlyAffectedEvents * volumeMultiplier + 0.5);
    return total + (scenario.violatedRuleId === null ? 0 : scaledEvents * scenario.unitEconomicImpactCents);
  }, 0);
  const violations = scenarios.filter((scenario) => !scenario.evaluation.passed).length;

  const events = scenarios.map((scenario, index) => Object.freeze({
    eventId: `${profile.id}:${seed}:${index + 1}`,
    scenarioId: scenario.id,
    caseId: scenario.caseId,
    sequence: index + 1,
    offsetSeconds: index,
    passed: scenario.evaluation.passed,
    severity: scenario.evaluation.passed ? null : scenario.severity,
    category: scenario.evaluation.passed ? null : scenario.category,
    exposureDeltaCents: scenario.modeledExposureCents,
    ruleId: scenario.evaluation.violations[0]?.ruleId ?? null,
  }));

  const raw: RunResult = {
    runId: stableRunId(profile.id, seed, volumeMultiplier, guardrails),
    profileId: profile.id,
    profileName: `${profile.company} / ${profile.agentName}`,
    seed,
    policyVersion: `${profile.id}-policy-v1.0.0`,
    guardrails,
    volumeMultiplier,
    generatedAt: "2025-04-01T00:00:00.000Z",
    scenarios,
    events,
    monthlyExposureCents,
    annualizedExposureCents: monthlyExposureCents * 12,
    baselineMonthlyExposureCents,
    baselineAnnualizedExposureCents: baselineMonthlyExposureCents * 12,
    violations,
    passing: scenarios.length - violations,
    severeViolations: scenarios.filter((scenario) => !scenario.evaluation.passed && (scenario.severity === "Critical" || scenario.severity === "High")).length,
    exposureByCategoryCents,
    severityCounts,
    assumptions: {
      mode: "DEMO MODE — SYNTHETIC TEST FIXTURES",
      currency: "USD",
      monthlyPeriod: "30-day modeled month",
      volumeMultiplier,
      roundingRule: "Scale monthly affected events to the nearest whole event; exact halves round up, then multiply integer cents.",
      volumeScaling: "Linear incidence assumption: each scenario's monthly affected-event count is multiplied by the decision-volume factor and rounded to the nearest whole event (half up). Unit economic impact is held constant.",
      exposureDefinition: "Modeled monthly economic exposure under the stated synthetic event-frequency and unit-impact assumptions; not observed loss or a forecast.",
      seed,
    },
  };
  return deepFreeze(raw);
}
