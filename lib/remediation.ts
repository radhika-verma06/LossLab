import { runRiskEngine } from "./risk-engine";
import type { GuardrailId, RemediationResult, RunResult } from "./types";

export function replayWithGuardrails(baseline: Readonly<RunResult>, guardrails: readonly GuardrailId[]): Readonly<RemediationResult> {
  const canonicalBaseline = runRiskEngine({
    profileId: baseline.profileId,
    seed: baseline.seed,
    volumeMultiplier: baseline.volumeMultiplier,
  });
  if (canonicalBaseline.monthlyExposureCents !== baseline.baselineMonthlyExposureCents) {
    throw new Error("The supplied result does not reconcile with the canonical baseline fixture set.");
  }
  const remediated = runRiskEngine({
    profileId: baseline.profileId,
    seed: baseline.seed,
    volumeMultiplier: baseline.volumeMultiplier,
    guardrails,
  });
  const affectedScenarioIds = Object.freeze(canonicalBaseline.scenarios.flatMap((original) => {
    const after = remediated.scenarios.find((scenario) => scenario.id === original.id);
    return after && !original.evaluation.passed && after.evaluation.passed ? [original.id] : [];
  }));
  const preventedExposureCents = canonicalBaseline.monthlyExposureCents - remediated.monthlyExposureCents;
  const residualExposureCents = remediated.monthlyExposureCents;
  if (preventedExposureCents < 0 || preventedExposureCents + residualExposureCents !== canonicalBaseline.monthlyExposureCents) {
    throw new Error("Guardrail replay failed its baseline = prevented + residual reconciliation.");
  }
  return Object.freeze({
    baseline: canonicalBaseline,
    remediated,
    baselineExposureCents: canonicalBaseline.monthlyExposureCents,
    preventedExposureCents,
    residualExposureCents,
    reductionBasisPoints: canonicalBaseline.monthlyExposureCents === 0 ? 0 : Math.floor(preventedExposureCents * 10000 / canonicalBaseline.monthlyExposureCents),
    affectedScenarioIds,
    assumptions: "Guardrails in this deterministic replay are modeled as fully enforcing the listed controls (100% rule-compliance efficacy for those checks). Exposure is prevented only for a baseline failing trace that passes after reevaluation. This is an explicit synthetic assumption, not observed efficacy, measured savings, or a real-world guarantee.",
  });
}
