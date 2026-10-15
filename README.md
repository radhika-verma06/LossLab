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
- Four persistent workspace areas behind a 220px sidebar: Overview, Run tests, Reports and Integrations. Overview is the landing view, so the core demonstration is one click — in fact zero clicks — away.
- A pure deterministic policy evaluator examining structured action traces.
- Forty sequenced test events per profile, including real authored violations and passing fixtures.
- Immutable, deeply frozen canonical `RunResult` consumed by the UI, events, charts, API and export.
- A single shared session owns the selected profile, the current result and the selected controls, so every screen always agrees. Moving between areas re-runs nothing and duplicates nothing.
- Guardrail comparison replays the same underlying structured traces with alternate evaluator controls. It only reduces exposure when the reevaluated unsafe actions are intercepted.
- Integer-cent monthly and annual amounts, documented incident scaling and baseline/prevented/residual reconciliation.
- Interactive volume sensitivity (0.5×–2×), clickable evidence and downloadable JSON report.
- A two-column demonstration workspace: the action timeline on the left shows each proposed action and its evaluated outcome (accepted, duplicate detected, blocked by safeguard); the result card on the right shows attempts, unsafe actions and modeled exposure, and its primary action runs the real remediation engine over the identical trace.
- Plain-English rule copy per rule identity, so a violation is explained without policy jargon while the underlying rule ID stays visible as evidence.
- Zod-validated local API and TypeScript SDK facade. No keys, external service calls or database are required for the demo.
- Supabase-compatible SQL schema and seed example for future production persistence; neither is used by the demo.

## Demonstration limitations and input audit

1. No production agent is connected; conversation text and actions are fixed test fixtures.
2. Unit impact, affected event incidence, baseline period and guardrail interception are assumptions. They are not empirically calibrated.
3. The UI and the exported JSON both say synthetic/demonstration. A result is not an actual loss estimate.
4. Guardrail replay assumes a selected control intercepts the unsafe action it checks (100% efficacy for that deterministic fixture). No real-world prevention rate is measured.
5. Each profile has 14 or 8 authored violating fixtures, plus distinct passing fixtures repeated deterministically to fill 40 suite slots. Repeated passes are not additional independent data.
6. The three supplied exposure schedules reconcile: SkyBridge totals **$12,437**, Meridian totals **$8,920**, and AtlasPay totals **$23,011**. Every case preserves its required integer-cent product. AtlasPay unit economics represent lost contribution from legitimate payments blocked in error—not gross payment volume.
7. This repository includes the server routes; a static-only hosting platform cannot execute them. Use a server-capable Next.js Node deployment.
8. The session reducer supports a run lifecycle (start, rate, complete) and an event cursor, and unit tests cover them, but **no screen renders those controls**. Playback is not reachable in the shipped UI, and it was never an engine input.

## Architecture

### In one sentence

LossLab is a **pure function with a UI on top**: fixtures go in, a rule check and some integer
arithmetic happen, and one frozen result comes out that every screen reads.

Nothing is interactive in the sense of being unpredictable. There is no model call, no clock and no
randomness in the path that produces a number.

### What happens when you click something

1. **You pick a profile** — SkyBridge, Meridian or AtlasPay. That bundles 40 authored test fixtures.
   No request is made and nothing is generated at runtime.
2. **The engine evaluates all 40.** For each fixture it compares the recorded actions in the trace
   against that fixture's own written policy, then records which rule was broken, by which action,
   and what the supporting evidence is.
3. **Failures get a price.** Every failing fixture carries two stated assumptions: how many affected
   events happen per month, and what one such event costs. Multiplying them, **in integer cents**,
   produces that fixture's modeled monthly exposure.
4. **Everything downstream reads the same object.** The four screens, the JSON export, the SDK and
   the HTTP routes all render one immutable `RunResult`. None of them recompute, trim or adjust it.

### Where each piece lives

| Layer | File | What it is responsible for |
|---|---|---|
| Fixtures | `lib/data.ts` | Frozen synthetic profiles, the 40 traces, the rules and the economics. Authored, never generated. |
| Evaluation | `lib/evaluator.ts` | A pure check of one trace against one policy. Returns violations, blocked actions and evidence. |
| Model | `lib/risk-engine.ts` | Runs the evaluator across a profile, does the cent arithmetic and builds the immutable `RunResult`. |
| Replay | `lib/remediation.ts` | Re-runs the **same** traces with safeguards enabled, then reconciles `baseline = prevented + residual`. |
| Session | `lib/session.tsx` | Holds the selected profile, the current result and the selected controls, and shares them with every screen. |
| Screens | `components/**` | Render a result. They format cents and derive display-only ratios (a bar width, a percentage); no screen computes a money amount. |
| Interfaces | `lib/sdk.ts`, `app/api/v1/**` | The same engine exposed as a typed SDK and three validated HTTP routes. |

### How the pieces connect

The pipeline runs one way, and nothing in it reaches back upstream:

```text
  AUTHORED FIXTURES                                    lib/data.ts
  3 profiles · 40 scenarios · structured action traces
                        │
                        ▼
  PURE EVALUATOR                              lib/evaluator.ts
  each trace vs. its own written policy
  → violations, blocked actions, evidence
                        │
                        ▼
  INTEGER-CENT MODEL                          lib/risk-engine.ts
  affected events/month × unit impact
  → modeled monthly exposure, in cents
                        │
                        ▼
  ONE IMMUTABLE RunResult
  ───────────────────────  the only source of truth, read by
                           Overview · Run tests · Reports · Integrations
                           the JSON export · the SDK · the /api/v1 routes
```

The safeguard loop is the one path that can change a figure:

```text
  RunResult ──► replayWithGuardrails(result, controls)   lib/remediation.ts
                     │  re-evaluates the SAME traces, with that control enabled
                     ▼
                baseline = prevented + residual
```

It changes for one reason only: a reevaluated action that used to fail now passes. The trace itself is
byte-for-byte identical before and after, and the app never pretends the agent proposed something
different.

### Boundaries the design keeps on purpose

- **Money is computed once, in the engine.** Every amount on screen reaches it through
  `formatUsd`/`formatUsdExact` from the engine's integer cents. Screens reuse those cents for
  display-only ratios, but no screen produces or alters an amount.
- **The evaluator is pure.** It reads only the trace and the policy — no clock, no randomness, no
  network, no model.
- **One result object.** `RunResult` is deeply frozen, so no screen can quietly mutate a number.
- **Replay is a re-evaluation, not a rewrite.** Enabling a control never edits the fixture, and it
  never pretends the agent proposed something different.
- **Presentation cannot influence outcomes.** There is no WebGL surface, and no animation, timing or
  scroll input reaches the engine.

## Data flow and state

`lib/data.ts` holds frozen synthetic profiles, scenarios, transcripts, economic inputs and structured tool traces. `lib/evaluator.ts` derives violations from trace contents; it does not read a presentation `status` field. `lib/risk-engine.ts` evaluates fixtures, computes deterministic run identity, event sequence, categorized exposure and the immutable `RunResult`.

`lib/session.tsx` owns the selected profile, the active area, one current result, the volume factor and the selected remediation controls — plus run-lifecycle fields (phase, event cursor, playback rate) that the shipped UI does not render, as noted in the limitations above. Navigating between areas leaves all of this alone. Nothing in it can accumulate exposure twice, because the exposure lives in the immutable `RunResult`, not in the session.

No screen does arithmetic. All four areas read the same `RunResult` and present it differently: Overview shows the primary failing scenario as an action timeline plus a result card, Run tests lists all 40 evaluated fixtures with filters, Reports aggregates exposure and the remediation comparison, and Integrations documents the SDK and HTTP contract. Reports also holds an independently reevaluated remediation result; JSON export serializes those same values together with their stated assumptions.

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

Requires Node.js **20.9+** (Next.js 16's minimum) and npm. Developed and verified on Node 22.23.2.

```sh
npm ci
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

Tests cover profile/fixture totals, cent multiplication, rule IDs, passing cases, idempotency, approval gates, instruction trust boundaries, currencies and discounts, guardrail replay/reconciliation, determinism, volume scaling, playback invariance, SDK/Zod contracts, local API routes and shared session behavior. Three Playwright browser tests cover the refund → safeguard → retest narrative, the report figures, and the served build's security headers and CSP:

```sh
npx playwright test
# or, against the deployed build:
LOSSLAB_BASE_URL=https://losslab-xi.vercel.app npx playwright test
```

## Deployment

Deploy to a server-capable Next.js host/runtime (Node server or compatible managed Next platform) and run `npm run build` then `npm start`. API routes are server functions. Do not use GitHub Pages, static export, or any deployment that drops route handlers. The local demonstration itself needs no production integration values.

This release runs **Next.js 16.4.1** on React 18.3.1, with `npm audit --omit=dev` reporting **0 vulnerabilities**. It previously pinned Next.js 14.2.35, and no patch existed on that major — every advisory fix was a major-version upgrade, so the move was made deliberately and verified with the full suite (`npm run verify`, three Playwright tests, a clean `npm ci`, and a browser pass over all four screens). The upgrade branch is `next-16-security-upgrade` and `main` keeps the previous known-good Next 14 build. The audit history, the reachability analysis for each advisory group and the exact changes required are in `SECURITY_FINDINGS.md`, and the deployment handoff is in `SUBMISSION_CHECKLIST.md`.

Vercel needs no `vercel.json` and no environment variables; Next.js App Router is auto-detected and the three route handlers deploy as serverless functions.

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
