# LossLab — final submission checklist

Status recorded on 16 October 2026, on branch `next-16-security-upgrade`. Nothing in the "Verified"
section is aspirational: each row was produced by running the command or flow named beside it, on a
clean `npm ci` install, after the last source change.

## 1. Verified in this release

| Check | Command / flow | Result |
|---|---|---|
| Clean install | `rm -rf node_modules && npm ci` | pass; no invalid and no missing packages |
| Lint | `npm run lint` | pass, 0 warnings (ESLint 9.39.1 flat config, `eslint-config-next@16.4.1`) |
| Types | `npm run typecheck` | pass |
| Unit tests | `npm test` | 8 files, **34 tests** pass |
| Production build | `npm run build` | pass — Next.js **16.4.1** (Turbopack); `/` and `/_not-found` static, 3 dynamic route handlers |
| Full chain | `npm run verify` | pass end to end |
| Browser suite (local) | `npx playwright test` | **3 passed** |
| Deploy-path pre-flight | `LOSSLAB_BASE_URL=http://127.0.0.1:3399 npx playwright test` against a server started outside Playwright | **3 passed** in 1.5 s; no local server spawned (port 3322 stayed free), so the external-base code path is proven |
| Refund → safeguard → retest E2E | `npx playwright test` | pass; run ID changes, `$3,120.00` → `$0.00` |
| Suite/report figures E2E | `npx playwright test` | pass; `$9,696` prevented, `77.96%` reduction |
| Served build + headers + CSP E2E | `npx playwright test` | pass; 7 headers, 0 CSP violations, 0 console errors |
| Production audit | `npm audit --omit=dev` | **0 vulnerabilities** (was 2: 1 critical, 1 high) |
| Full-tree audit | `npm audit` | 17 findings (6 moderate, 9 high, 2 critical) — build/test tooling only, never shipped |
| Security headers | `curl -D -` on `next start` | all 7 headers present |
| `x-powered-by` | `curl -D -` | absent |
| Image optimizer | probe `/_next/image` | no optimized payload on either host — 404 locally, 400 `INVALID_IMAGE_OPTIMIZE_REQUEST` at Vercel's edge; the app has 0 `next/image` usages |
| Initial JS payload | 7 chunks served from `next start`, gzip-transfer measured | 654 kB decoded / **199 kB transferred** |
| UI type floor | rendered-DOM audit, 4 screens | minimum 11 px; 0 text nodes below 10 px |
| No WebGL | rendered-DOM audit | 0 `<canvas>` elements |
| Motion | rendered-DOM audit | transitions present, all disabled under `prefers-reduced-motion` |
| Main-thread health | long-task observer, 4 screens | 0 long tasks |
| Flask/`5050` independence | source + built-artifact scan (§2) | no dependency of any kind |

## 2. No dependency on localhost:5050 or the Flask server (confirmed)

| Evidence | Finding |
|---|---|
| `grep` for `5050`, `localhost:5050`, `127.0.0.1:5050` across `app/`, `components/`, `lib/`, `public/`, `next.config.mjs`, `package.json` | 0 matches |
| Same search inside the built artifact (`.next/server`, `.next/static`) | 0 matches; the only `5050` byte-strings anywhere are hex hashes in build caches |
| `flask` case-insensitive in the built artifact | only the lucide-react `flask-conical` icon used for the "Run tests" nav item |
| `public/` contents | **0 files** — the app ships no static assets that could reference anything |
| Outbound calls in `app/` and `lib/` (`fetch`, `http`, `axios`, `WebSocket`) | none — the app never makes a network request |
| The 3 route handlers | import only `next/server` and `@/lib/*`; every figure is computed in-process |
| `app.py` | the Flask draft itself; it is not imported, and does not start on this machine (`ModuleNotFoundError: No module named 'flask'`) |
| `.vercelignore` | now excludes `app.py`, `risk_engine.py`, `templates/`, `LossLab/`, `tests/`, `docs/`, `supabase/` from the upload |

**Conclusion:** the deployed application is a self-contained Next.js build with no runtime dependency
on port 5050, on the Flask server, or on any external host.

## 3. Demonstration readiness

- [ ] `npm install && npm run build && npm run start`, open <http://localhost:3000>.
- [ ] Rehearse `DEMO_SCRIPT.md` end to end inside five minutes.
- [ ] Confirm the sidebar `Synthetic demo` indicator is visible on every screen you show.
- [ ] Confirm you can complete the refund → violation → safeguard → retest flow without narration gaps.
- [ ] Know the five numbers cold: `$3,120` **modeled monthly exposure** on the refund case, baseline
      `$12,437`, idempotency-only residual `$8,789`, full-suite residual `$2,741`, modeled reduction
      `77.96%`.
- [ ] Have `SECURITY_FINDINGS.md` open in a second window in case a judge asks about dependencies.

## 4. Repository

- [x] Git initialised; `main` holds the previous known-good Next 14.2.35 release, untouched.
- [x] The upgraded release lives on branch `next-16-security-upgrade`.
- [x] `node_modules/`, `.next/`, `.next-playwright/`, `venv/`, `coverage/`, `test-results/`,
      `playwright-report/`, `.shots/`, `*.tsbuildinfo`, `*.log`, `.DS_Store` and `.env*` are all
      excluded — verified with `git ls-files` and `git status --ignored`.
- [x] No secrets are tracked.
- [x] Commit author set repository-locally to `radhika-verma06` only.
- [x] Published to <https://github.com/radhika-verma06/LossLab> (**public**) with
      `next-16-security-upgrade` as the **default branch**, so the repo opens on the shipped release.
      `main` is pushed alongside it as the preserved Next 14 fallback.
- [x] The published repo was re-verified the way a judge will read it: cloned fresh, then
      `npm ci && npm run verify && npx playwright test` — 34 unit tests, 3/3 browser tests,
      `npm audit --omit=dev` → 0 vulnerabilities. No untracked file is needed to build it.

### Optional cleanup before submitting

`app.py`, `risk_engine.py` and `templates/index.html` are an obsolete earlier draft. They are **not
part of the Next.js application**, are excluded from the deployment, and `app.py` does not start.
Leaving them in the repository is harmless but may confuse a judge reading the source tree — deleting
them is a one-command change if you prefer.

## 5. Deployment

**Deployed and verified at <https://losslab-xi.vercel.app>.**

Deployed with the Vercel CLI (resolves to **64.2.0** with no global install), authenticating
interactively in a browser — no token was requested or stored:

```bash
cd /Users/radhikaverma/LossLab
npx vercel@latest login          # interactive, browser-based
npx vercel@latest link           # first run only: create or select the project
npx vercel@latest --prod         # deploy from this directory
```

Next.js App Router is auto-detected; **no `vercel.json` is required**, the three route handlers
deploy as serverless functions, and the app needs **no environment variables** — there is no database,
no auth provider and no third-party API. A clean `npm ci` installs the lockfile exactly, and
`next build` succeeds from it.

The public app is verified end to end with the same suite used locally:

```bash
LOSSLAB_BASE_URL=https://losslab-xi.vercel.app npx playwright test
```

That external-base path was pre-flighted before the deploy: pointing the suite at a server started
outside Playwright already passed 3/3 without Playwright spawning a local one. The one assertion that
could not run earlier is the `https:` protocol check, which by design only fires against an
`https://` base — it now runs.

### Deployed verification — <https://losslab-xi.vercel.app>

The deployed build's **application code matches HEAD**. The last commit touching anything a Next
build consumes is `122ec4e`; everything committed since changes only markdown, `.gitignore`,
`.vercelignore`, test files and the unused Flask draft template, none of which affects the built
artifact. A redeploy is therefore optional and would not change the served app.

| Check | Result |
|---|---|
| Browser suite over HTTPS | **3 passed** — `LOSSLAB_BASE_URL=https://losslab-xi.vercel.app npx playwright test` |
| Transport | `http://` → **308** → `https://`; the HTTPS URL returns 200 |
| Security headers | all 7 present on the deployed response; `x-powered-by` absent (`server: Vercel`) |
| API surface | `GET /api/v1/agents` → 200; `GET /api/v1/reports/not-a-run` → 400 |
| Deployed engine matches the local engine | `POST /api/v1/runs` for `skybridge`/seed 241 → **201**, `runId LL-D5FFC54B`, `monthlyExposureCents 1_243_700`, 40 events, 14 failing / 26 passing — **identical to the same call evaluated in-process locally** |
| Stateless serverless instances | `GET /api/v1/reports/LL-D5FFC54B` returned **200 on 3/3** attempts, so the deterministic run-ID fallback covers cold or multiple instances rather than relying on in-memory state |
| Deployed build identity | Turbopack runtime chunk served and the “Modeled monthly exposure” copy present, so the deployment is the **Next 16 release**, not the Next 14 fallback |
| Task 1 + task 2 copy on the live host | `Modeled monthly exposure $3,120`; `Original risk · Critical` and `Mitigated replay passed` both present after the safeguard runs |
| UI audit on the deployed host | min font 11 px, 0 nodes < 10 px, 0 canvases, 0 horizontal overflow at 1440 and 390 |
| Severity palette in deployed CSS | badge renders `#C7534B` on `#FBEDEC` — the Tailwind `content`-glob fix survives Vercel's CSS pipeline |
| Runtime cleanliness | 0 CSP violations, 0 console errors, 0 page errors, 0 long tasks |

- [x] Authenticate the Vercel CLI (browser session; no token was requested or stored).
- [x] Deploy to production and capture the HTTPS URL.
- [x] Run the suite above against the deployed URL — same 3 tests, over HTTPS.
- [x] The project is deployed.

## 6. Submission artefacts to hand in

- [x] Source repository — <https://github.com/radhika-verma06/LossLab> (default branch
      `next-16-security-upgrade`).
- [x] Deployed HTTPS URL — <https://losslab-xi.vercel.app>.
- [ ] `DEMO_SCRIPT.md` — recording plan and spoken script.
- [ ] `SECURITY_FINDINGS.md` — dependency audit and patch record.
- [ ] `README.md` — product and architecture overview.
- [ ] Five-minute screen recording, recorded from the production build.

## 7. Known limitations to state honestly if asked

- All inputs, evaluations, event rates, unit economics and modeled exposure are **synthetic
  fixtures** — not observed customer losses, live telemetry, or a forecast.
- 100% interception for enabled guardrails is an explicit assumption, not measured efficacy.
- The `/api/v1` routes are an in-memory demo API; runs are not persisted. On a cold instance the
  report route can only recover a run it can recompute — the three seeded profiles at their default
  seed 241. In testing against the deployed host, repeated lookups of both a default-seed and a
  custom-seed run (`seed 9999`) all returned 200, which means the instance stayed warm and the
  failure mode could not be reproduced; it is inferred from the code rather than observed.
- Pricing tiers are illustrative and unvalidated; no commercial agreements exist.
- No live agent adapter, webhook, queue worker, identity provider or CI gate ships in this demo.
- React is still **18.3.1**. Next.js 16 supports it but deprecates it and will remove the support in
  Next 17; the move to React 19 is the next dependency step and was not needed to clear the audit.
- `npm audit` on the full tree (including build/test tooling) reports 17 findings. None of those
  packages reach the deployed artifact.
