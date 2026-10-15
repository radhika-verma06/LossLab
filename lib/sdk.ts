import { runRiskEngine } from "./risk-engine";
import { replayWithGuardrails } from "./remediation";
import { getProfile } from "./data";
import type { GuardrailId, ProfileId, RemediationResult, RunResult } from "./types";

export interface LocalRunOptions {
  readonly seed?: number;
  readonly volume?: number;
  readonly guardrails?: readonly GuardrailId[];
}

function run(profileId: string, options: LocalRunOptions = {}): Readonly<RunResult> {
  const profile = getProfile(profileId);
  return runRiskEngine({
    profileId: profile.id,
    profile,
    seed: options.seed,
    volumeMultiplier: options.volume,
    guardrails: options.guardrails,
  });
}

function replay(result: Readonly<RunResult>, guardrails: readonly GuardrailId[]): Readonly<RemediationResult> {
  return replayWithGuardrails(result, guardrails);
}

export const losslab = Object.freeze({
  run,
  replay,
  agents: Object.freeze(["skybridge", "meridian", "atlaspay"] as const),
});

export type LocalProfileId = ProfileId;
