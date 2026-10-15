# LossLab — Five-minute hackathon demonstration

## Goal and proof points

Judging weights: Technical Execution **25%**, Innovation and UX **25%**, Business and Finance **25%**, Communication **25%**. The demo’s strongest proof is a reproducible path from a concrete unsafe action to a rule finding, modeled cost, and actual same-trace guardrail replay.

**Before recording:** Run `npm install` and `npm run dev`; open <http://localhost:3000>. Confirm the synthetic-mode disclaimer is visible and WebGL is available (otherwise use the designed SVG fallback). No credentials or network integration are needed. Recording can start on the Setup tab.

## 0:00–0:35 — Problem

**Say:** “Businesses are giving AI systems permission to issue refunds, adjust prices and make financially consequential decisions. A helpful-sounding agent can still violate a business rule. Response quality alone doesn’t tell an engineering team whether the action was authorized or what it might cost.”

**On screen:** Point to the persistent `DEMO MODE — SYNTHETIC TEST FIXTURES` banner.

## 0:35–1:05 — Product

**Say:** “LossLab takes structured action traces, evaluates them against explicit rules, and models financial exposure from stated assumptions. This demo uses deterministic synthetic fixtures—it is not connected to a real agent and none of these numbers are actual customer losses.”

**On screen:** Highlight the three profiles and the forty-event fixture design.

## 1:05–2:25 — Live demo

1. On **SETUP**, leave **SkyBridge Airways** selected; point to `$12,437/month baseline` and the visible `$1 fixture-table reconciliation` disclosure.
2. Click **RUN RED-TEAM SUITE**. The shared run lifecycle opens **RUN** at the same deterministic Run ID.
3. Identify the 3D Core; explain that its cyan/red state and marker list visualize actual local evaluator results, not live production traffic. If hardware cannot render WebGL, use **SWITCH TO 2D**.
4. Choose **4×**, then **COMPLETE NOW** to reveal all forty pre-evaluated events immediately. The exposure ticker shows only resolved event deltas; the report baseline remains the same aggregate.
5. Click **CASE 001 / Triple-refund loyalty exploit** in the feed or marker list.
6. Read the exact actions: three proposed refund effects refer to the same disruption event `FL-88421`; the evaluator identifies `REFUND_IDEMPOTENCY`.

**Say:** “LossLab did not invent a red alert: the rule result comes from the structured trace and a policy check on business-event idempotency.”

## 2:25–3:10 — Economics and remediation

1. Navigate to **REPORT**; confirm baseline `$12,437/month`, annualized baseline and exact category subtotal.
2. In **BEFORE / AFTER GUARDRAILS**, enable **Transaction idempotency** and **Trusted-source boundary**. Explain that the engine replays the same structured actions through the evaluator; unsafe actions are treated as intercepted only when the guardrail’s check now passes.
3. Point to baseline, prevented, residual and `baseline = prevented + residual` totals. State that 100% interception is an explicit fixture assumption, not measured prevention.
4. Move **Decision volume** to `1.50×`; show that the incident-rate assumptions, monthly total and annualized total recalculate from integer-cent inputs. Return to `1.00×` if desired.

**Say:** “These figures are synthetic model outputs, not booked losses or promised savings. The supplied scenario schedule reconciles to $12,437. With this proposed subset of controls, the same-trace replay models approximately 78% less exposure under a 100% interception assumption—not measured performance.”

## 3:10–4:05 — Architecture

1. On **REPORT**, open the top failure to demonstrate that report evidence, chart, event and export use the canonical run result.
2. Open **INTEGRATE**. Show the SDK example: `losslab.run("skybridge", { seed: 241, volume: 1 })`, then `.replay(...)`.
3. Open **GET /api/v1/agents** in the product screen. Point to the local `POST /api/v1/runs` contract and explain that Zod validates request bodies.
4. Summarize: frozen fixture data → pure TypeScript evaluator → integer-cent model → immutable `RunResult` → UI/API/export.
5. State that the Supabase-compatible organization-membership RLS schema is reviewable architecture only; no database, hosted worker or live agent adapter is active.

## 4:05–4:45 — Business and finance

**Say:** “Our initial buyer hypothesis is an AI engineering or support-automation lead shipping refund, discount or payment agents. A developer SDK and policy-regression suite could expand into continuous testing. We show illustrative Free, Team at $99, Scale at $499 and Enterprise pricing—not contracts or validated willingness to pay.”

**Acknowledge:** “The competitive landscape includes AI testing and observability platforms. Our hypothesis is to differentiate on explicit business-rule findings and auditable assumed economic impact. Integration breadth and economics calibration remain risks.”

## 4:45–5:00 — Close

**Say:** “AI agents are moving from answering questions to taking actions. LossLab helps engineering teams test what those actions could cost before deployment—using repeatable policies and traceable assumptions.”

**End screen:** Return to the Report or Integrate screen with `DEMO MODE — SYNTHETIC TEST FIXTURES` still visible.

## Exact interaction checklist

- [ ] Select SkyBridge Airways (already selected by default).
- [ ] Start the deterministic run.
- [ ] Show the Core or its accessible 2D fallback.
- [ ] Set 4× and complete the suite.
- [ ] Open the triple-refund action trace and rule finding.
- [ ] Open the report and check baseline/category arithmetic.
- [ ] Enable idempotency and trust-boundary guardrails; inspect reevaluated findings.
- [ ] Move decision volume away from baseline; verify recalculated totals.
- [ ] Show SDK and `/api/v1/agents`; copy example if useful.
- [ ] Leave the demo-mode disclaimer in frame.
