# Completion report — 4 November 2026

## Delivered

The local product is an integrated Next.js/NestJS/PostgreSQL workspace. It opens directly to an authentic dashboard, offers focused practice, 12/24-question quick tests and the 100-question shortened mock, saves/resumes answers and navigation, and provides results, filtered review, mistake replay, skills, goals, recommendations and paginated history.

The new light editorial interface uses locally served Manrope/Source Serif, porcelain/cobalt/apricot tokens, an application sidebar/mobile navigation, a separate exam layout, grouped passages/audio, reduced-motion-aware transitions and accessible controls. Returning users see their actual saved state; first-time visitors see zero activity and useful actions.

## Final architecture and file map

| Stage | Implemented files/responsibility | Decision/verification |
|---|---|---|
| A: audit/preservation | docs/rebuild-audit.md; ignored .rebuild archives | Original Git baseline and incoming uncommitted rebuild preserved; no remote/deployment changes |
| B: foundation | package.json, workspaces under apps and packages, apps/api/src/database | Npm workspaces, shared public contracts, explicit TypeORM SQL migrations; no Nx or automatic synchronization |
| C: content/auth | packages/content; database/content.ts; auth/auth.service.ts | Repeatable content hashing/versioning; Google code flow/PKCE/state/nonce/stable subject; HttpOnly hashed sessions; consent merge/import |
| D: engine | assessments/engine.ts, attempt.service.ts, legacy.ts; api.controller.ts | Unique group-preserving selection, private active DTOs, server scoring/deadlines, row locks/revisions, immutable results, idempotent submit |
| E: UI | apps/web/src/app; components/workspace, test, results; lib/api.ts; features/attempt | Real API integration, guest bootstrap, pending local save/retry, responsive reading/listening, result/review filters |
| F: intelligence | progress/insights.ts, progress.service.ts; workspace/history-chart.tsx | Five-observation threshold, exact recommendation reasons, resolved-mistake tracking, separate comparison cohorts and real goals |
| G: verification/deployment prep | tests/unit, tests/integration, tests/e2e, docs, Dockerfile, .env.example files, CI | Local automated checks and compiled-runtime smoke pass; external credentials/deployment remain separate |

The backend uses normalized identity/content/attempt tables, stimulus JSONB, exact question/blueprint versions, explicit constraints and two version-controlled migrations. It derives progress from actual attempts rather than maintaining redundant summary tables. The web bundle does not import the private content package.

## Checks performed

| Check | Result |
|---|---|
| Type checking | Passed for API, web, shared/content packages and tests |
| ESLint | Passed |
| Vitest | 32 passed: 23 unit/legacy regressions and 9 PostgreSQL-backed integration scenarios |
| Playwright | 20 passed across desktop and mobile Chromium; affected six scenarios rerun successfully after final dashboard/setup copy correction |
| Accessibility | No axe WCAG A/AA violations in tested dashboard, setup, exam and dialog/drawer flows; keyboard and reduced-motion workflows pass |
| Responsive screenshots | All six workspace routes checked at desktop/mobile widths without horizontal overflow; reading/results/review also inspected |
| Content validation | 150 questions, 90 units, nine images and 64 audio clips; no missing assets |
| Original preservation | All 73 media files match Git blob hashes; all 150 questions deep-match the original bank after intentional asset-path normalization |
| Database | Fresh migrations, repeated seed, version retention, immutable finalized answer/result updates, ownership, pagination, conflicts, deadlines and import verified against embedded PostgreSQL through TypeORM's PostgreSQL driver |
| Google auth | Mocked code exchange/token verification pass for state, PKCE, nonce rejection, single-use flow, returning identity, session rotation/expiry/logout and consent merge |
| Production build | Next 16.4.5 optimized build, Nest compilation and shared/content builds pass |
| Compiled-runtime smoke | Compiled Next and Nest modules run together: dashboard, reading, answer save, submit, review and mobile width checks pass; zero browser exceptions; clean teardown |
| Dependency security | npm audit --omit=dev: zero advisories; full audit: 16 moderate ESLint/minimatch development-tool advisories, zero high/critical |

The initial restricted Turbopack build stalled; rerunning with normal process permissions completed successfully. No bundler workaround or error suppression was added.

## Integration and migration status

Google Sign-In is fully wired to the backend and appears when the three Google variables are configured. Sessions are database-backed, 30 days, revocable, host-only and HttpOnly; production uses Secure cookies. Sign-in failure returns to Account with a recovery message. Guest activity stays separate until explicit merge consent.

Neon configuration is ready, with certificate-verified TLS, a bounded query pool, direct migration URL, versioned schema and repeatable importer. No Neon credentials were supplied, so the local tests used an isolated embedded PostgreSQL engine. No remote database was created or modified.

The 100-question content remains available. Full 200-question simulation is intentionally unavailable because the bank cannot meet its quotas. No duplicate filler questions or predicted official scores were introduced. Imported legacy results are labeled and rescored; original storage is not deleted, and unrecorded legacy elapsed time is not presented as measured.

## Run and deploy

Run `npm ci`, then `npm run dev`; open http://127.0.0.1:3000. Node 22.13+ or a supported Node 24 release is required.

Required deployed configuration: DATABASE_URL, DATABASE_DIRECT_URL, WEB_ORIGIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL and build/runtime API_INTERNAL_URL. DB_POOL_SIZE, PORT, API_HOST and NODE_ENV complete the runtime settings. See apps/api/.env.example, apps/web/.env.example and docs/deployment.md for exact commands and cookie/proxy/Google/Neon setup.

The Dockerfile supplies API and web targets. CI validates the application without publishing. The existing GitHub Pages app was not replaced. No deployment, force-push, paid service or production data mutation occurred.

## Remaining boundaries

- Real Google consent/login and actual Neon connectivity require credentials and configured public origins; neither is externally verified.
- Public deployment still needs explicit approval, an HTTPS hosting environment, edge rate limits/monitoring, and an owner-approved guest-data retention policy.
- Docker image builds and physical Chrome/Edge/Samsung Internet device checks were not run; browser coverage is desktop/mobile Chromium.
- Sixteen moderate advisories remain in development lint tooling. Production dependencies are clean. Do not apply npm audit fix --force blindly; its suggested ESLint downgrade is incompatible with the current configuration.
- Content/media provenance is documented in docs/content-provenance.md; commercial redistribution rights still require owner confirmation.
