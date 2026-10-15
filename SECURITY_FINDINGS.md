# LossLab — production dependency security findings

Assessment date: 16 October 2026. Scope: the committed `package-lock.json` for the Next.js
application in this repository (the Flask draft `app.py` / `risk_engine.py` / `templates/` is
not installed, not built, and not deployed).

Reproduce with:

```bash
npm audit --omit=dev      # production view (exit 1 while findings remain)
npm audit                 # full tree including build/test tooling
```

## 1. What the audit reports

**Current state of the shipping build: `npm audit --omit=dev` reports `found 0 vulnerabilities`.**
The upgrade described in §4 is applied on branch `next-16-security-upgrade`.

For the record, the starting position was **four entries** — a count of vulnerable *packages*, not
advisories; the `next` entry alone aggregated 23 separate advisories.

| # | Package | Was | Severity | Advisories | Fix path | Now |
|---|---------|-----|----------|------------|----------|-----|
| 1 | `next` | 14.2.35 | **critical** | 23 | only via `next@16.4.1` (breaking) | `16.4.1` |
| 2 | `postcss` (nested at `node_modules/next/node_modules/postcss`) | 8.4.31 | high | 4 | only via `next@16.4.1` (breaking) | `8.5.23` |
| 3 | `playwright` (transitive) | 1.49.1 | high | 1 | `npm audit fix` (non-breaking) | `1.64.1` |
| 4 | `@playwright/test` | 1.49.1 | high | via `playwright` | `npm audit fix` (non-breaking) | `1.64.1` |

Starting point: `4 vulnerabilities (3 high, 1 critical)`.
After the non-breaking Playwright bump: `2 vulnerabilities (1 high, 1 critical)`.
After the `next@16.4.1` upgrade: **`0 vulnerabilities`**.

**Why Playwright appears under `--omit=dev`.** `@playwright/test` is declared by `next` as an
*optional peer dependency* (`peerDependenciesMeta["@playwright/test"].optional = true`), so npm
does not prune it from the production audit even though the root declares it under
`devDependencies`. Playwright is used only for local verification. It is never imported by
application code, never bundled into the client or server output, and is not installed into a
Vercel production deployment.

## 2. The two critical advisories

### GHSA-p293-qw3h-jr36 / CVE-2026-75604 — unauthenticated RCE on Windows-hosted servers

- Affected: `>=13.4.0 <15.5.24` and `>=16.0.0 <16.3.3`. Patched: `15.5.24`, `16.3.3`. CVSS 9.0.
- Condition: "remote code execution when the server is hosted on machines using a Windows
  filesystem". The advisory states there is no workaround other than upgrading, and "you should
  upgrade immediately if your server is hosted on Windows".
- **Reachability in LossLab: not reachable.** Development is on macOS and the intended host is
  Vercel (Linux). No Windows-hosted deployment exists.

### GHSA-2xp9-vwfh-vxw4 — unauthenticated RCE in the Image Optimization API when AVIF files are used

- Affected: `>=10.0.0 <15.5.24` and `>=16.0.0 <16.3.3`. Patched: `15.5.24`, `16.3.3`.
- Condition: RCE in libheif, reached through `sharp` when **AVIF files are optimized** by the
  Image Optimization API.
- **Reachability in LossLab: not reachable.** The application contains zero `next/image` usages
  and `/public` contains no image assets, so nothing can be submitted to the optimizer. This
  release additionally sets `images.unoptimized: true` and probes against `/_next/image` return
  no optimized payload.

## 3. The remaining high-severity advisories (grouped)

All of these are in the `next` 14.2.35 tree or its pinned `postcss`.

**Denial of service on React Server Component / Server Action parsing** — `GHSA-h25m-26qc-wcjf`
(insecure RSC deserialization, `<15.0.8`), `GHSA-q4gf-8mx6-v5v3` (`<15.5.15`),
`GHSA-8h8q-6873-q5fj` (`<15.5.16`), `GHSA-m99w-x7hq-7vfj` (Server Actions, `<15.5.21`),
`GHSA-4c39-4ccg-62r3` (unbounded Server Action payload, Edge runtime). These target the request
parsing path that any App Router deployment serves. **This is the one genuine residual risk**:
the app does not use Server Actions, but RSC request handling is on the public surface, so a
public URL can be made to consume CPU/memory.

**Server-side request forgery** — `GHSA-c4j6-fc7j-m34r` (WebSocket upgrades, `<15.5.16`),
`GHSA-p9j2-gv94-2wf4` (rewrites, `<15.5.21`), `GHSA-89xv-2m56-2m9x` (Server Actions on custom
servers, `<15.5.21`). **Not reachable**: there is no custom server, no `rewrites()` entry, no
WebSocket upgrade handling, and no Server Actions.

**Middleware / routing bypass and cache issues** — `GHSA-36qx-fr4f-26g5` (middleware bypass in
Pages Router apps using `i18n`, `<15.5.16`), `GHSA-3g8h-86w9-wvmq` (middleware redirect cache
poisoning), `GHSA-wfc6-r584-vfw7` / `GHSA-68g3-v927-f742` / `GHSA-4633-3j49-mh5q` (RSC cache
confusion). **Not reachable**: no `middleware.ts`, no `i18n` config, no Pages Router.

**XSS in Next.js-managed inline script/style emission** — `GHSA-ffhc-5mcf-pf4q` (CSP nonces),
`GHSA-gx5p-jg67-6x7h` (`beforeInteractive` scripts with untrusted input). **Not reachable**: no
`next/script`, no nonce plumbing, no untrusted value is rendered into a script tag.

**Image optimizer DoS / disk growth** — `GHSA-h64f-5h5j-jqjh`, `GHSA-9g9p-9gw9-jx7f` (DoS via
`remotePatterns`), `GHSA-3x4c-7xq6-9pq8` (unbounded disk cache). **Not reachable**: no
`next/image`, no `images.remotePatterns`, no image assets.

**postcss 8.4.31** — `GHSA-qx2v-qp2m-jg93` (XSS via unescaped `</style>`, `<8.5.10`),
`GHSA-6g55-p6wh-862q` (arbitrary file read via `sourceMappingURL`, `<=8.5.11`),
`GHSA-r28c-9q8g-f849` (path traversal via previous source map, `<=8.5.17`),
`GHSA-fxqj-rqcc-2cmp` (incomplete fix, `<=8.5.22`). Condition: processing untrusted CSS or
attacker-controlled `sourceMappingURL` at build time. **Not reachable at runtime**; this project
compiles only its own Tailwind input at build time.

### Playwright GHSA-7mvr-c777-76hp / CVE-2025-59288

- Affected `<1.55.1`, patched `1.55.1`. High.
- Condition: macOS/Windows **browser reinstall scripts** in the Playwright repository invoke
  `curl -k`, so a MitM attacker can substitute a privileged installer package. It requires a user
  or CI job to run those specific `reinstall_*` scripts on a hostile network.
- **Reachability in LossLab: not applicable to the deployed app.** The scripts are not shipped in
  the npm package we consume and are never executed by `npx playwright install`. The finding is
  validated against the local developer machine only.

## 4. Patch strategy

Facts that determine the strategy:

- `next@14.2.35` **is the newest 14.x release**. The advisory ranges all cap below the 15.x line,
  so **there is no patch that stays on Next 14**; every fix is a major-version upgrade.
- Lowest version that clears all `next` advisories: **15.5.24** (latest 15.x is `15.5.28`).
- `next@15.5.28` still pins `postcss@8.4.31`, so it would **not** clear the postcss findings.
  `next@16.4.1` pins `postcss@8.5.23`, which clears all four postcss advisories.
- Both `next@15` and `next@16` accept React `^18.2.0 || ^19`, so the current React 18.3.1 does
  not have to move in the same step. That keeps the upgrade surface smaller than it looks.
- Playwright needs `>=1.55.1` (current release is `1.64.1`).

**Applied (non-breaking, verified).** `npm audit fix` bumped `@playwright/test` and `playwright`
to 1.64.1. This removed two high findings and touched no production dependency.

**Applied on `next-16-security-upgrade` (major version, verified).** `next` was moved to `16.4.1`,
which also pins `postcss@8.5.23`. This clears every remaining production finding:

```bash
npm install next@16.4.1 --save-exact
npm install --save-dev --save-exact eslint@9.39.1 eslint-config-next@16.4.1
npm ci && npm run verify && npx playwright test
```

The upgrade required exactly two production-side changes, both mechanical:

- Next.js 16 passes dynamic route params as a promise, so `GET` in
  `app/api/v1/reports/[runId]/route.ts` awaits `params` (and its unit test passes a resolved promise).
- `eslint-config-next@16` requires ESLint 9, so `.eslintrc.json` was replaced by a flat
  `eslint.config.mjs` using the preset's native flat export. No lint suppression was added; the two
  warnings the new preset surfaced on config files were fixed by naming their default exports.

`npm audit fix --force` was **not** run. Next.js emits a deprecation warning for React 18, which
Next 16 still supports; React is deliberately left at 18.3.1 so the security fix and a framework
runtime change are not entangled. Moving to React 19 is the next dependency step and is tracked in
§7 of `SUBMISSION_CHECKLIST.md`.

**Post-upgrade verification** (`next-16-security-upgrade`): clean `npm ci`, `npm run verify`,
3/3 Playwright tests, all 7 security headers present on `next start`, `/_next/image` still returning
no optimized payload, and a browser pass over all 4 screens with 0 CSP violations and 0 console
errors.

**Why the previous deferral was safe, kept for the record.** Before the upgrade, the two criticals
were condition-gated (Windows host, AVIF image optimization) and neither condition existed here; the
residual exposure was denial-of-service class on RSC request parsing. That reasoning is no longer
load-bearing now that the upgrade has shipped.

## 5. Compensating controls applied in this release

Set in `next.config.mjs`. Re-verified with `curl -D -` against the **Next.js 16.4.1** production
`next start` server, and asserted on every run by the served-build Playwright test:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

Also applied: `images.unoptimized: true` (the optimizer surface is unused) and
`poweredByHeader: false`. A full browser pass over Overview → Run tests → Reports → Integrations
reports zero `securitypolicyviolation` events, zero page errors and zero console errors, with inline
styles and self-hosted fonts still applying.

## 6. Build- and test-tooling findings (not shipped)

`npm audit` without `--omit=dev` reports **17 vulnerabilities (6 moderate, 9 high, 2 critical)**.
These are confined to build and test tooling that never reaches the deployed artifact:
`vitest`/`tinypool` (critical), `@vitest/mocker`/`vite`/`vite-node`/`esbuild`/`tsx`,
`tailwindcss`/`chokidar`/`braces`/`micromatch`/`fast-glob`/`glob`/`@next/eslint-plugin-next`, and
the root `postcss@8.4.49` used only by the Tailwind build step (the `next`-nested postcss is now
clean). They are recorded here so the production number is not mistaken for the whole picture, and
so the dev-tooling debt is visible rather than ignored.
