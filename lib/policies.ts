import type { GuardrailId } from "./types";

export interface GuardrailDefinition {
  readonly id: GuardrailId;
  readonly label: string;
  readonly description: string;
  readonly assumedCoverageBasisPoints: number;
}

export const GUARDRAILS: readonly GuardrailDefinition[] = Object.freeze([
  Object.freeze({ id: "transaction-idempotency", label: "Transaction idempotency", description: "Use one stable business-event key before any refund or support credit.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "trusted-source-boundary", label: "Trusted-source boundary", description: "Uploaded documents and customer text cannot become internal policy or staff approval.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "currency-conservation", label: "Currency conservation", description: "Reconcile minor units against the captured amount and settlement currency.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "escalation-budget", label: "Bounded retries and escalation", description: "Enforce the configured retry ceiling and prohibit repeated financial side effects.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "discount-stack-limit", label: "Discount stack limit", description: "Allow only the policy-approved offer set per order.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "human-approval-gate", label: "Human approval gate", description: "Require authenticated approval for actions above the configured threshold.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "refund-window-check", label: "Eligibility-window validation", description: "Compare verified action time against policy eligibility timestamps.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "payment-release-validation", label: "Trusted payment release validation", description: "Protect verified merchant payments from unsupported automated holds.", assumedCoverageBasisPoints: 10000 }),
  Object.freeze({ id: "price-floor-enforcement", label: "Commercial price floor", description: "Apply one eligible promotion after currency normalization and enforce a minimum price.", assumedCoverageBasisPoints: 10000 }),
]);

export const GUARDRAIL_IDS: readonly GuardrailId[] = Object.freeze(GUARDRAILS.map((control) => control.id));

/** These five explicit controls model a 77.96% reduction on the SkyBridge synthetic fixture set. */
export const PROPOSED_GUARDRAILS: readonly GuardrailId[] = Object.freeze([
  "transaction-idempotency",
  "trusted-source-boundary",
  "currency-conservation",
  "refund-window-check",
  "price-floor-enforcement",
]);

export function isGuardrailId(value: string): value is GuardrailId {
  return GUARDRAIL_IDS.some((guardrail) => guardrail === value);
}
