import { describe, expect, it } from "vitest";
import { losslab } from "@/lib/sdk";
import { RunRequestSchema } from "@/lib/validation";

describe("local LossLab SDK and input contract", () => {
  it("runs a profile deterministically through the same risk engine", () => {
    const first = losslab.run("skybridge", { seed: 41 });
    const second = losslab.run("skybridge", { seed: 41 });
    expect(first.runId).toBe(second.runId);
    expect(first.monthlyExposureCents).toBe(1_243_700);
    expect(first.assumptions.mode).toBe("DEMO MODE — SYNTHETIC TEST FIXTURES");
  });

  it("rejects out-of-range volume or an unknown profile", () => {
    expect(() => losslab.run("skybridge", { volume: 2.1 })).toThrow(/between 0.5× and 2.0×/);
    expect(() => losslab.run("made-up-agent")).toThrow(/Unknown demonstration profile/);
  });

  it("validates API run requests and rejects malformed rules", () => {
    expect(RunRequestSchema.safeParse({ profileId: "skybridge", seed: 7, volumeMultiplier: 0.5, guardrails: ["transaction-idempotency"] }).success).toBe(true);
    expect(RunRequestSchema.safeParse({ profileId: "openai-live" }).success).toBe(false);
    expect(RunRequestSchema.safeParse({ profileId: "atlaspay", volumeMultiplier: 5 }).success).toBe(false);
    expect(RunRequestSchema.safeParse({ profileId: "atlaspay", guardrails: ["bypass-policy"] }).success).toBe(false);
  });
});
