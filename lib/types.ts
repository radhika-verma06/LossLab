export type ProfileId = "skybridge" | "meridian" | "atlaspay";
export type ScenarioCategory = "Policy Breach" | "Prompt Injection" | "Economic Manipulation" | "Escalation Loop";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type ActionType = "refund" | "discount" | "cancel" | "escalate" | "retry" | "block_payment" | "reassign" | "support_credit" | "authorize";
export type GuardrailId =
  | "transaction-idempotency"
  | "trusted-source-boundary"
  | "currency-conservation"
  | "escalation-budget"
  | "discount-stack-limit"
  | "human-approval-gate"
  | "refund-window-check"
  | "payment-release-validation"
  | "price-floor-enforcement";
export type RuleId =
  | "REFUND_IDEMPOTENCY"
  | "REFUND_APPROVAL_THRESHOLD"
  | "UNTRUSTED_INSTRUCTION_SOURCE"
  | "CURRENCY_CONSERVATION"
  | "ESCALATION_BUDGET"
  | "DISCOUNT_STACK_LIMIT"
  | "REFUND_WINDOW_ELIGIBILITY"
  | "PERMITTED_ACTION"
  | "PAYMENT_RELEASE_VALIDATION"
  | "PRICE_FLOOR";

export interface ToolAction {
  readonly actionId: string;
  readonly type: ActionType;
  readonly transactionId?: string;
  readonly businessEventId?: string;
  readonly amountCents?: number;
  readonly resultingPriceCents?: number;
  readonly currency?: string;
  readonly originalAmountCents?: number;
  readonly originalCurrency?: string;
  readonly approvedByHuman?: boolean;
  readonly authorizationSource?: "authenticated_staff" | "customer_text" | "uploaded_document" | "none";
  readonly sourceTrust?: "system_policy" | "verified_staff" | "customer_message" | "uploaded_document";
  readonly instructionText?: string;
  readonly discountCode?: string;
  readonly discountFamily?: string;
  readonly retryAttempt?: number;
  readonly escalationAttempt?: number;
  readonly policyPermitsAction?: boolean;
  readonly eligibleUntil?: string;
  readonly actedAt?: string;
  readonly paymentTrusted?: boolean;
  readonly unitEconomicContributionCents?: number;
  readonly notes?: string;
}

export interface BusinessPolicy {
  readonly refundApprovalThresholdCents: number;
  readonly maxRefundsPerTransaction: number;
  readonly maxEscalations: number;
  readonly maxRetries: number;
  readonly maxDiscountsPerOrder: number;
  readonly allowedCurrencies: readonly string[];
  readonly permittedActions: readonly ActionType[];
  readonly minimumPriceFloorCents: number;
  readonly preventCustomerSourcedAuthorization: boolean;
}

export interface ScenarioFixture {
  readonly id: string;
  readonly caseId: string;
  readonly name: string;
  readonly category: ScenarioCategory;
  readonly severity: Severity;
  readonly agentResponse: string;
  readonly userMessage: string;
  readonly violatedRuleId: RuleId | null;
  readonly violatedRuleDescription: string;
  readonly expectedAction: string;
  readonly observedAction: string;
  readonly structuredToolTrace: readonly ToolAction[];
  readonly monthlyAffectedEvents: number;
  readonly unitEconomicImpactCents: number;
  readonly dollarCostCents: number;
  readonly proposedGuardrail: GuardrailId;
  readonly explanatoryEvidence: string;
  readonly policy: BusinessPolicy;
  readonly evidenceTokens: readonly string[];
  readonly passExplanation: string;
}

export interface AgentProfile {
  readonly id: ProfileId;
  readonly company: string;
  readonly agentName: string;
  readonly useCase: string;
  readonly dailyDecisionVolume: number;
  readonly agentsTouchingMoney: number;
  readonly monthlyExposureCents: number;
  readonly currency: "USD";
  readonly summary: string;
  readonly controlsSummary: readonly string[];
  readonly scenarios: readonly ScenarioFixture[];
}

export interface RuleViolation {
  readonly ruleId: RuleId;
  readonly description: string;
  readonly observed: string;
  readonly expected: string;
  readonly evidence: readonly string[];
  readonly actionIds: readonly string[];
}

export interface Evaluation {
  readonly passed: boolean;
  readonly violations: readonly RuleViolation[];
  readonly evidence: string;
  readonly evaluatedActions: readonly ToolAction[];
  readonly guardrailsApplied: readonly GuardrailId[];
  readonly blockedActionIds: readonly string[];
}

export interface EvaluatedScenario extends ScenarioFixture {
  readonly evaluation: Evaluation;
  readonly modeledExposureCents: number;
}

export interface SimulationEvent {
  readonly eventId: string;
  readonly scenarioId: string;
  readonly caseId: string;
  readonly sequence: number;
  readonly offsetSeconds: number;
  readonly passed: boolean;
  readonly severity: Severity | null;
  readonly category: ScenarioCategory | null;
  readonly exposureDeltaCents: number;
  readonly ruleId: RuleId | null;
}

export interface RunAssumptions {
  readonly mode: "DEMO MODE — SYNTHETIC TEST FIXTURES";
  readonly currency: "USD";
  readonly monthlyPeriod: "30-day modeled month";
  readonly volumeMultiplier: number;
  readonly roundingRule: "Scale monthly affected events to the nearest whole event; exact halves round up, then multiply integer cents.";
  readonly volumeScaling: string;
  readonly exposureDefinition: "Modeled monthly economic exposure under the stated synthetic event-frequency and unit-impact assumptions; not observed loss or a forecast.";
  readonly seed: number;
}

export interface RunResult {
  readonly runId: string;
  readonly profileId: ProfileId;
  readonly profileName: string;
  readonly seed: number;
  readonly policyVersion: string;
  readonly guardrails: readonly GuardrailId[];
  readonly volumeMultiplier: number;
  readonly generatedAt: string;
  readonly scenarios: readonly EvaluatedScenario[];
  readonly events: readonly SimulationEvent[];
  readonly monthlyExposureCents: number;
  readonly annualizedExposureCents: number;
  readonly baselineMonthlyExposureCents: number;
  readonly baselineAnnualizedExposureCents: number;
  readonly violations: number;
  readonly passing: number;
  readonly severeViolations: number;
  readonly exposureByCategoryCents: Readonly<Record<ScenarioCategory, number>>;
  readonly severityCounts: Readonly<Record<Severity, number>>;
  readonly assumptions: RunAssumptions;
}

export interface RemediationResult {
  readonly baseline: RunResult;
  readonly remediated: RunResult;
  readonly baselineExposureCents: number;
  readonly preventedExposureCents: number;
  readonly residualExposureCents: number;
  readonly reductionBasisPoints: number;
  readonly affectedScenarioIds: readonly string[];
  readonly assumptions: string;
}
