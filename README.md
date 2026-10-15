# LossLab — AI Agent Risk Engineering

**Stress-test autonomy. Measure exposure.**

> **DEMO MODE — SYNTHETIC TEST FIXTURES**
>
> This hackathon application evaluates authored, deterministic fixtures. It does not connect to or observe production agents. Every dollar value is a modeled scenario exposure under stated synthetic event-rate and unit-impact assumptions—not an actual customer loss, measured prevention, forecast, or guarantee.

## Product overview

LossLab evaluates structured AI-agent action traces against explicit business rules, identifies the specific policy discrepancy and estimates modeled financial exposure. The demo includes three synthetic profiles, a 40-event repeatable scenario suite, a pure TypeScript evaluator, a report, guardrail replay, JSON export and local HTTP/SDK interfaces.

### Problem and why financial risk tests matter

Support and operations agents can recommend or execute refunds, credits, discounts, cancellations, payment holds and escalations. Conversational quality scores do not guarantee that those actions respect authorization, idempotency, price, trust-boundary or eligibility policies. An agent might sound considerate while issuing the same refund three times, treating a customer-uploaded “manager override” as policy, or blocking a verified payment because of a currency-unit mismatch.

LossLab tests the proposed action itself. It links the trace to explicit evidence and a business-policy rule, then applies transparent assumed economics. This is intended to complement response-quality evaluation, not replace payment controls, fraud review, policy owners or production risk governance.

### Initial customers and buyers

- **Initial ICP:** AI engineering teams working on customer-support automation, ecommerce refund agents, SaaS sales/retention agents and payment/fraud operations.
- **Initial buyer:** Head of AI Engineering, Engineering Lead or Support Automation Lead.
- **End users:** AI engineers, QA engineers and risk-operations analysts.

These are target hypotheses, not claimed customers.

## Working features

- Three switchable synthetic agent profiles: SkyBridge Airways, Meridian Cloud and AtlasPay.
- Four persistent dashboard views: Setup, Run, Report and Integrate.
- A pure deterministic policy evaluator examining structured action traces.
- Forty sequenced test events per profile, including real authored violations and passing fixtures.
- Immutable, deeply frozen canonical `RunResult` consumed by the UI, events, charts, API and export.
- Pause/resume, replay, 4× presentation speed and complete-now lifecycle controls. Playback changes timing only; it does not change evaluated results or exposure.
- Guardrail comparison replays the same underlying structured traces with alternate evaluator controls. It only reduces exposure when the reevaluated unsafe actions are intercepted.
- Integer-cent monthly and annual amounts, documented incident scaling and baseline/prevented/residual reconciliation.
- Interactive volume sensitivity (0.5×–2×), clickable evidence and downloadable JSON report.
- A 2D SVG finding map that plots every evaluated violation around the synthetic agent core. Marker colour and position come from the local evaluator result; no WebGL or animation is used.
- Zod-validated local API and TypeScript SDK facade. No keys, external service calls or database are required for the demo.
- Supabase-compatible SQL schema and seed example for future production persistence; neither is used by the demo.

## Demonstration limitations and input audit

1. No production agent is connected; conversation text and actions are fixed test fixtures.
2. Unit impact, affected event incidence, baseline period and guardrail interception are assumptions. They are not empirically calibrated.
3. The UI, chart, marker and exported JSON say synthetic/demonstration. A result is not an actual loss estimate.
4. Guardrail replay assumes a selected control intercepts the unsafe action it checks (100% efficacy for that deterministic fixture). No real-world prevention rate is measured.
5. Each profile has 14 or 8 authored violating fixtures, plus distinct passing fixtures repeated deterministically to fill 40 suite slots. Repeated passes are not additional independent data.
6. The three supplied exposure schedules reconcile: SkyBridge totals **$12,437**, Meridian totals **$8,920**, and AtlasPay totals **$23,011**. Every case preserves its required integer-cent product. AtlasPay unit economics represent lost contribution from legitimate payments blocked in error—not gross payment volume.
7. This repository includes the server routes; a static-only hosting platform cannot execute them. Use a server-capable Next.js Node deployment.

## Architecture

```text
                    ┌─────────────────────────────────────────────┐
                    │ Next.js App Router · four persistent views  │
                    │ Setup → Run → Report → Integrate             │
                    └─────────────────────┬───────────────────────┘
                                          │ shared session / immutable RunResult
                                          ▼
  Authored fixtures → structured action traces → pure policy evaluator
                                                │
                                 ┌──────────────┴──────────────┐
                                 ▼                             ▼
                         policy findings              integer-cent model
                                 └──────────────┬──────────────┘
                                                ▼
                   canonical RunResult → feed / scene / charts / JSON
                                                │
                              local SDK and validated HTTP API
                                                │
                         future: versioned persistence / worker queue
```

## Data flow and state

`lib/data.ts` holds frozen synthetic profiles, scenarios, transcripts, economic inputs and structured tool traces. `lib/evaluator.ts` derives violations from trace contents; it does not read a presentation `status` field. `lib/risk-engine.ts` evaluates fixtures, computes deterministic run identity, event sequence, categorized exposure and the immutable `RunResult`.

`lib/session.tsx` owns the selected profile, active tab, one current result, run phase, event cursor, playback rate, selected finding, volume factor and selected remediation controls. Navigating tabs leaves this state alone. The feed cursor reveals already-evaluated `RunResult.events`; it does not append new findings or accumulate exposure a second time. Playback rate and event cursor are not engine inputs.

The 3D scene is a client-only visual projection of result/cursor data. Scene colors, particle layout and camera movement never determine policy outcomes, marker identity or financial amounts. The Report screen aggregates `RunResult` and an independently reevaluated remediation result. JSON export serializes those same values and their assumptions.

## Risk-engine methodology

### Policy evaluator

`evaluateScenario(scenario, guardrails)` is a pure TypeScript evaluation of `structuredToolTrace` and its explicit `policy`. It handles:

- Refund/credit amount thresholds and verified human authorization.
- Business-event idempotency for repeated refunds and support credits.
- Untrusted instructions from customer text or uploaded documents.
- Currency support, original-currency and amount conservation.
- Retry/escalation caps.
- Discount stacking and disallowed actions.
- Refund eligibility windows.
- Payment release validation for trusted merchants.

The result contains rule IDs, observed/expected behavior, action IDs and structured evidence. When a guardrail is selected, the evaluator reevaluates the same trace and records which unsafe action would be blocked before execution. This does not mutate the fixture or pretend the agent actually changed its proposal.

### Simulation determinism

Profile scenarios, seed `241`, policy version, volume and sorted guardrail IDs determine the stable run ID. Every suite contains exactly 40 ordered fixtures. Identical inputs create byte-identical serialized run results. Seeded values use authored stable case order; no random timer or remote inference is involved. Pausing, replaying or setting playback speed to 4× changes only how quickly the UI reveals the existing result.

### Exposure model and integer arithmetic

For each scenario:

```text
scenario dollar cost cents = monthly affected events × unit economic impact cents
modeled monthly exposure cents = sum of evaluated failing scenario costs
annualized exposure cents = modeled monthly exposure cents × 12
```

All internal monetary values are integer cents. At a volume factor, event count is multiplied and rounded to the nearest integer; exact halves round up (`floor(n × factor + 0.5)`). Unit impact is held constant. The resulting total is a synthetic 30-day modeled scenario sum, not real booked dollars, a prediction, or observed loss.

The stated SkyBridge $12,437 headline exactly matches the sum of its fourteen scenario products. Meridian and AtlasPay likewise reconcile to their requested baselines. AtlasPay unit economics are intended to be lost **economic contribution** for payments that would otherwise have been legitimate, not the gross value of blocked transactions.

### Guardrail replay

`replayWithGuardrails(result, guardrailIds)` regenerates a canonical guardrail-free baseline and calls the same engine with the selected policies. The six default proposed controls produce a 77.96% modeled reduction on the SkyBridge baseline fixture, near the requested illustrative 78% scenario; the result follows from the intercepted same-trace cases and cents arithmetic, not a hardcoded display multiplier. For each fixture, the action trace stays byte-for-byte the same. A baseline failure contributes residual exposure only if the reevaluation still fails; intercepted failures contribute zero residual. In cents:

```text
baseline = prevented + residual
```

The disclosed assumed efficacy is deterministic full enforcement of the selected matching policy control for synthetic cases. It is not an empirically measured savings rate.

## Local SDK

```ts
import { losslab } from "./lib/sdk";

const result = losslab.run("skybridge", { seed: 241, volume: 1 });
console.log(result.monthlyExposureCents); // 1_243_700 baseline cents

const replay = losslab.replay(result, [
  "transaction-idempotency",
  "trusted-source-boundary",
]);
console.log(replay.remediated.monthlyExposureCents);
console.log(replay.preventedExposureCents + replay.residualExposureCents === replay.baselineExposureCents);
```

`losslab.run` accepts one of `skybridge | meridian | atlaspay`, optional non-negative safe `seed`, `volume` from 0.5 through 2.0 and typed guardrail IDs. It returns a frozen `RunResult` by calling the same deterministic engine as the app.

## Local REST API

No credentials are necessary. All responses identify synthetic mode.

```sh
curl http://localhost:3000/api/v1/agents

curl -X POST http://localhost:3000/api/v1/runs \
  -H 'Content-Type: application/json' \
  -d '{"profileId":"skybridge","seed":241,"volumeMultiplier":1,"guardrails":[]}'

# Use the runId returned from POST:
curl http://localhost:3000/api/v1/reports/LL-XXXXXXXX
```

- `GET /api/v1/agents` lists only the three seeded fixtures.
- `POST /api/v1/runs` validates a strict Zod request and returns the canonical engine result; invalid input is HTTP 400.
- `GET /api/v1/reports/[runId]` reads an in-process bounded result store, or deterministically rebuilds a known baseline profile result from its stable ID. Unknown IDs return 404.

The registry is process-local and bounded to 100 entries. A Node process restart clears it; no persistence is claimed. The UI/API do not store user/customer data.

## Database schema and tenant security

`supabase/schema.sql` is future architecture only. It defines organizations and explicit organization memberships; agents; immutable policy-set versions and JSON policy rules; simulation runs; authored/ingested scenarios; rule findings; remediation runs with a database reconciliation constraint; and audit events. UUID primary/foreign keys, tenant-aware composite foreign keys, checks, constraints and common indexes are provided.

RLS is enabled on every table. Membership is verified through `auth.uid()` and `organization_members`; writes to policies, runs and agents use role-scoped checks, audit reads are admin-scoped, and no public or “allow all” demo policy is included. There is no Supabase client in the local runtime. `supabase/seed.sql` is a commented, illustrative schema example that requires an authenticated sandbox user; it is not needed to run this app.

## Scalability roadmap

A production implementation could evolve toward stateless API nodes, a queue-backed simulation orchestrator, horizontally scalable workers, batched typed trace ingestion, tenant quotas and rate limits, database partition/index tuning, immutable content-hashed policy versions, replayable run configuration, object storage for reports, audit trails and CI release gates. Organization isolation would be enforced at query/API boundaries as well as RLS. These systems are **not** present in this MVP.

## Security and sensitive data

The demo has no login, does not collect customer traces and makes no outbound runtime request. Production agent traces can contain personal information, payment metadata, support transcripts and embedded prompt-injection text. A real product would need data minimization, redaction controls, retention/erasure policy, tenant-level authorization, encryption, auditability, secrets handling, rate limits, upload sandboxing, incident response and jurisdiction-specific legal review. Untrusted input must remain labeled by source and must not define the policy evaluator’s authority.

## Competition and differentiation

AI testing and observability platforms may measure tool calls, model quality and execution traces. LossLab’s intended focus is explicit business-policy evaluation linked to assumed, inspectable financial impact and reproducible before/after control replay. The demonstration does not prove superior prevention, savings, technical moat, demand or willingness to pay. Adapter breadth, policy-authoring ergonomics, model-specific evaluation, customer-trace security, calibration, and competition are significant risks.

## Pricing hypothesis and business model

Illustrative launch pricing shown in the demo (not active products or customer agreements):

| Tier | Hypothetical price | Proposed limit/features |
|---|---:|---|
| Free | $0/month | 1 agent, 25 executions/month, basic checks, community |
| Team | $99/month | Up to 5 agents, 1,000 executions/month, saved reports, custom policies |
| Scale | $499/month | Up to 25 agents, 10,000 executions/month, versioning, team workflows |
| Enterprise | Custom | Higher volume, dedicated deployment options, custom rules, advanced security/integrations |

Possible revenue: team/agent subscription, metered simulation execution, enterprise deployment/support. Initial go-to-market hypothesis: sell to teams building refund and discount agents, offer an SDK/policy-regression workflow, expand toward continuous agent testing and CI, then add policy templates for additional business domains. CI and historical comparisons are roadmap items; no customer traction, market size, ROI or existing contracts are claimed.

Risks include competition from AI testing/observability tools, integration diversity, sensitivity and access controls for production traces, the calibration of financial assumptions, and customers’ willingness to pay.

## Local installation

Requires Node.js 18.17+ (Node 20 LTS recommended) and npm.

```sh
npm install
npm run dev
```

Open <http://localhost:3000>. No `.env`, hosted database, API key, login or external API is required. The development server runs the Next.js app and local API handlers.

## Automated tests

```sh
npm test
npm run typecheck
npm run lint
npm run build
# or
npm run verify
```

Tests cover profile/fixture totals, cent multiplication, rule IDs, passing cases, idempotency, approval gates, instruction trust boundaries, currencies and discounts, guardrail replay/reconciliation, determinism, volume scaling, playback invariance, SDK/Zod contracts, local API routes and shared session behavior. A Playwright browser run is recommended before a recorded submission.

## Deployment

Deploy to a server-capable Next.js host/runtime (Node server or compatible managed Next platform) and run `npm run build` then `npm start`. API routes are server functions. Do not use GitHub Pages, static export, or any deployment that drops route handlers. The local demonstration itself needs no production integration values. This project pins Next.js 14.2.35 as requested; `npm audit` reports published advisories for the required major version, including denial-of-service, SSRF, request-smuggling and XSS conditions. Do not expose the hackathon demo as a public production service until the framework is moved to a patched compatible release or protected by a deployment policy. Re-run `npm audit` when choosing a deployment target; upgrading across Next majors requires a deliberate compatibility migration.

## Future integrations

A real customer flow would look like:

```text
Customer AI agent
  → structured action traces
  → LossLab SDK/API adapter
  → versioned policy evaluator
  → findings
  → modeled financial impact
  → report
  → CI regression gate
```

The current typed trace contract and local engine establish an integration seam. LangChain/LangSmith adapters, raw endpoints, webhooks, customer identity, queue execution and CI release gates are future work; they are not implemented integrations.
