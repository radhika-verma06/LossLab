# LossLab — final submission checklist

Status recorded on 16 October 2026. Nothing in the "Verified" section is aspirational: each line
was produced by running the command or flow named beside it.

## 1. Verified in this release

| Check | Command / flow | Result |
|---|---|---|
| Lint | `npm run lint` | pass, 0 warnings |
| Types | `npm run typecheck` | pass |
| Unit tests | `npm test` | 8 files, 33 tests pass |
| Production build | `npm run build` | pass; `/` = 19.8 kB, 124 kB First Load JS |
| Full chain | `npm run verify` | pass end to end |
| Judge flow E2E | `npx playwright test` | pass |
| 8-step refund demo E2E | `npx playwright test` | pass |
| UI type floor | rendered-DOM audit, 4 screens | 0 text nodes below 10px (was 55–93%) |
| No canvas / effects | rendered-DOM audit | 0 WebGL canvases, 0 box-shadows, 0 animations |
| CSP clean | browser pass over all 4 screens | 0 `securitypolicyviolation`, 0 page errors, 0 console errors |
| Security headers | `curl -D -` on `next start` | all 7 headers present |
| `x-powered-by` | `curl -I` | suppressed |
| Image optimizer | probe `/_next/image` | no optimized payload returned |
| Production audit | `npm audit --omit=dev` | 2 findings, down from 4 |

## 2. Demonstration readiness

- [ ] `npm install && npm run build && npm run start`, open <http://localhost:3000>.
- [ ] Rehearse `DEMO_SCRIPT.md` end to end inside five minutes.
- [ ] Confirm the `DEMO MODE — SYNTHETIC TEST FIXTURES` banner is visible on every screen you show.
- [ ] Confirm you can complete the eight-step airline-refund flow without narration gaps.
- [ ] Know the four numbers cold: baseline `$12,437`, idempotency-only residual `$8,789`, full-suite
      residual `$2,741`, modeled reduction `77.96%`.
- [ ] Have `SECURITY_FINDINGS.md` open in a second window in case a judge asks about dependencies.

## 3. Repository

- [x] Git initialised with a baseline snapshot commit.
- [x] `node_modules/`, `.next/`, `.next-playwright/`, `venv/`, `__pycache__/`, `coverage/`,
      `test-results/`, `playwright-report/`, `*.tsbuildinfo`, `*.log`, `.DS_Store` and `.env*`
      all excluded — verified with `git ls-files` and `git status --ignored`.
- [x] No secrets are tracked (searched the index for env/key/credential patterns).
- [x] Commit author set repository-locally to `radhika-verma06` only (no global Git config change).
- [ ] Decide the destination remote (`https://github.com/radhika-verma06/...`) and push. Pushing
      is deliberately left to you.

### Optional cleanup before submitting

These files are in the snapshot but are an obsolete earlier draft and are **not part of the
Next.js application**: `app.py`, `risk_engine.py`, `templates/index.html`, and the `LossLab/`
directory. `app.py` does not even start (`ModuleNotFoundError: No module named 'flask'`, recorded
in the now-ignored `app.log`). Leaving them in the repository is harmless but may confuse a judge
reading the source tree. They are excluded from the deployment by `.vercelignore`.

## 4. Security sign-off

- [x] Production audit run and every finding identified with installed version, advisory range and
      exploit condition.
- [x] Crucially: the two criticals are **condition-gated** — Windows-hosted servers
      (CVE-2026-75604) and AVIF image optimization (GHSA-2xp9-vwfh-vxw4). Neither condition exists
      in this app.
- [x] Non-breaking fix applied and verified: Playwright 1.49.1 → 1.64.1, browser suite re-run green.
- [ ] **Decision required before a long-lived public URL:** upgrade `next` to `16.4.1`, which is
      the only change that clears both remaining findings (`next` and its pinned `postcss@8.4.31`).
      There is no patch that stays on Next 14 — `14.2.35` is the newest 14.x release.
      `npm audit fix --force` was **not** run.
- [x] Impact of deferring documented: the residual exposure is denial-of-service class on React
      Server Component request parsing.

## 5. Deployment

Local production readiness is verified. A public HTTPS URL is **not yet produced** — no hosting
CLI or credentials exist on this machine.

```bash
# Vercel CLI is reachable without a global install:
npx vercel@latest --version        # verified: 64.2.0
npx vercel@latest login
npx vercel@latest --prod           # deploy from this directory
```

`.vercelignore` excludes vendored, generated and local-only paths from the upload. Next.js App
Router is auto-detected; no `vercel.json` is required, and the three API route handlers deploy as
serverless functions. The app needs **no environment variables** — there is no database, no auth
provider and no third-party API.

- [ ] Authenticate the Vercel CLI (provide `VERCEL_TOKEN` or complete the browser login).
- [ ] Deploy to production and capture the HTTPS URL.
- [ ] Re-run the browser flow against the deployed URL — verify the same eight steps, the security
      headers on the deployed host, and `GET /api/v1/agents` returning three profiles.
- [ ] Only then describe the project as deployed.

**Do not treat this project as deployment-ready until the security decision in section 4 is made
and the deployed URL has passed the browser flow.**

## 6. Submission artefacts to hand in

- [ ] Source repository (with the commit history from this session).
- [ ] Deployed HTTPS URL.
- [ ] `DEMO_SCRIPT.md` — recording plan and spoken script.
- [ ] `SECURITY_FINDINGS.md` — dependency audit and patch strategy.
- [ ] `README.md` — product and architecture overview.
- [ ] Five-minute screen recording, recorded from the production build.

## 7. Known limitations to state honestly if asked

- All inputs, evaluations, event rates, unit economics and modeled exposure are **synthetic
  fixtures** — not observed customer losses, live telemetry, or a forecast.
- 100% interception for enabled guardrails is an explicit assumption, not measured efficacy.
- The `/api/v1` routes are an in-memory demo API; runs are not persisted and are lost on restart.
- Pricing tiers are illustrative and unvalidated; no commercial agreements exist.
- No live agent adapter, webhook, queue worker, identity provider or CI gate ships in this demo.
- `npm audit` on the full tree (including build/test tooling) reports 19 findings; none of those
  packages reach the deployed artifact and they are listed in `SECURITY_FINDINGS.md` §6.
