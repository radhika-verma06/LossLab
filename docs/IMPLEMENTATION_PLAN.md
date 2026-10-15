# LossLab Implementation Plan

> **For agentic workers:** Execute inline, in order. Each phase ends with its focused verification.

**Goal:** Build a locally functional, auditable AI-agent risk-engineering MVP with deterministic synthetic runs, guardrail replay, report, API, and cinematic visualization.

**Architecture:** One Next.js 14 App Router server-capable app; a pure, immutable TypeScript `RunResult` is the canonical result for all views, APIs, markers and exports. Static seeded data is the only runtime data dependency. A shared client session owns profile, run and report across four tabs; playback is only a cursor over deterministic evaluated events.

**Tech Stack:** Next.js 14.2.35, React 18.3.1, TypeScript strict, Tailwind 3, Three.js 0.170, @react-three/fiber 8.18, @react-three/postprocessing 2.16, @react-three/drei 9.122, Zod 3, Lucide, Vitest 2.

**Spec:** Approved LossLab master build prompt and architecture in conversation.

## Global Constraints

- Demo has no required credentials, external runtime API calls, database, or third-party services.
- All synthetic reports visibly disclose `DEMO MODE — SYNTHETIC TEST FIXTURES`.
- `RunResult` has immutable profile, evaluated scenarios, event list, integer-cent totals and assumptions; UI does not calculate truth independently.
- Remediation reevaluates structured traces using alternative controls; it never adjusts a presentation number.
- Playback speed only changes event pacing, never evaluation or exposure.
- Identical profile, fixture, policy, seed and guardrail inputs are deterministic.
- Baseline, prevented and residual totals reconcile exactly in integer cents.
- WebGL is client-only, instanced, capped and optional; accessible 2D fallback works.
- Target a server-capable Next deployment, not static export.

## Module Map

- `lib/types.ts`: immutable shared domain contracts.
- `lib/policies.ts`, `lib/data.ts`: guardrail definitions and three deterministic profiles (14/8/8 violations plus passing cases to 40).
- `lib/evaluator.ts`: pure structured action-trace rule evaluator.
- `lib/risk-engine.ts`: deterministic `RunResult` and cents aggregation.
- `lib/remediation.ts`: policy replay and explicit assumed efficacy controls.
- `lib/simulation.ts`: stable 40-event ordering and playback-independent result.
- `lib/sdk.ts`, `lib/validation.ts`: typed local facade and Zod payload contracts.
- `app/api/v1/*`: validated local routes.
- `components/layout/*`: shared session and four-tab navigation.
- `components/setup`, `run`, `report`, `integrate`: views consuming canonical result.
- `components/scene/*`: lazy client-only R3F Core plus accessible 2D fallback.
- `supabase/schema.sql`, `supabase/seed.sql`: future org-scoped relational schema with membership-based RLS.
- `tests/*`: engine and API contract tests.
- `README.md`, `DEMO_SCRIPT.md`: architecture and judge-ready walkthrough.

## Tasks

### 1. New app foundation and test runner
Create package metadata, strict TypeScript, Tailwind, Next app shell and Vitest. Use explicitly compatible React 18 / R3F 8 package pins. Verify `npm install` and the bare production build.

### 2. Engine first (TDD)
Write focused tests for required profile amounts, unit arithmetic, rule violations/pass fixtures, idempotency, approvals, untrusted source, currencies, discount stack, determinism, volume sensitivity and report invariants. Implement domain types, authored structured traces, evaluator, aggregate result, simulation sequencing and remediation replay. APIs: `evaluateTrace(scenario, controls): Evaluation`; `runRiskEngine({ profileId, controls?, volumeMultiplier? }): Readonly<RunResult>`; `replayWithGuardrails(result, guardrails): Readonly<RemediationResult>`.

### 3. SDK, schemas and API
Zod validation and routes `GET /api/v1/agents`, `POST /api/v1/runs`, `GET /api/v1/reports/[runId]`. Use deterministic, bounded in-memory server report registry and typed `losslab.run(profileId, options)` facade. Test invalid inputs and report schema.

### 4. Shared UI and demonstration
One `LossLabSessionProvider` owns selected profile, canonical result, event cursor, run phase, detail selection, volume and guardrail replay. Tabs never reset state. Build Setup, Run (start/pause/resume/replay/4x/complete), Report (category/severity/top five, actual replay comparison, cents-sensitive volume, JSON export), Integrate (copyable SDK and APIs). All metrics derive from result/replay.

### 5. Visualization
Lazy dynamic client-only R3F scene, deterministic instanced particle field, central Core and persistent clickable finding markers. Risk visuals derive from result and cursor. Honor reduced motion and WebGL errors via a keyboard-accessible 2D orbital fallback; avoid per-frame React state updates.

### 6. Database/docs and final verification
SQL schema: organizations, explicit memberships, agents, immutable versioned policy sets/rules, runs, scenarios, findings, remediation, audit; constraints/indexes and no permissive RLS. Add seed SQL, detailed README and five-minute script. Run lint/typecheck/tests/build; run the UI in a real browser where available and exercise core judge flow; inspect final tree/diff and document environment limitations honestly.
