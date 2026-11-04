# TOEIC Practice 2.0

The root route is a real personal dashboard. All learner metrics come from stored attempts. The workspace offers focused practice, 12/24-question quick tests, a timed 100-question shortened mock, results, filtered review, mistake replay, learning goals, and history.

## Runtime

- `apps/web`: Next 16.4.5 App Router, React 19.2, strict TypeScript, Tailwind 4, Radix dialogs, Lucide, local Manrope/Source Serif fonts, Motion, TanStack Query, and a lazy Recharts history view.
- `apps/api`: Nest 11 REST API, Zod request validation, TypeORM DataSource/EntityManager, PostgreSQL, Google Auth Library, Helmet, structured Nest logging, OpenAPI at `/api/docs` on the API.
- `packages/shared`: public DTOs, part labels, accuracy and comparison contracts. No answer keys.
- `packages/content`: private typed question bank, preserved generator, and isolated legacy persistence/scoring code for regression coverage. Never imported by the frontend.
- `scripts/dev.mjs`: starts an embedded PostgreSQL engine via the PostgreSQL wire protocol when DATABASE_URL is absent. This is a local development convenience; production never silently falls back.

Npm workspaces retain the existing lockfile. No Nx, microservices, paid AI, form framework for two native inputs, or extra persistence abstraction is needed. TypeORM executes explicit, parameterized SQL rather than maintaining a second set of decorator entities for this SQL-oriented domain. The migrations are the schema source of truth; synchronize is always false.

## Data model

`users`, `oauth_identities`, `app_sessions`, `oauth_states`, and `preferences` hold identity, hashed opaque session tokens, short-lived OAuth flow state, and learning targets. Identity uses Google's stable subject, never email as a primary identity.

`question_units` store immutable content hashes and JSONB stimulus documents. `questions`, `choices`, `answer_keys`, `media_references`, and versioned `blueprints` normalize the remaining content. A unique partial index allows one current version per original unit. Imports retire old versions without deleting them.

`attempts` reference user and blueprint versions; `attempt_questions` reference exact immutable question versions and keep order, answers and review markers. Server timestamps define starts and deadlines. Results are computed inside a row-locked transaction and retained as an immutable result snapshot. PostgreSQL triggers protect finalized results and answer updates.

Summaries, recommendations, mistakes and activity are derived from real attempts. No separate materialized skill table is necessary at this scale. Overview metrics cover all history; charts use the latest 200 sessions. Mistake replay takes the most recent answered response per original question; a correct replay resolves that mistake. Linked groups remain intact.

## Trust and consistency

The Next server proxies `/api/*` to Nest on the same browser origin. HttpOnly, host-only, SameSite=Lax cookies become Secure in production. Mutations require an exact WEB_ORIGIN and a custom application header. No CORS permission is granted to unrelated origins.

Each edit supplies the server revision. A stale update receives 409; the UI offers retry or explicit use of the server state. A single pending edit is kept locally before the request and survives reload. Navigation and further answers wait until it is resolved. This bounds conflicts rather than silently merging answers from multiple devices. If localStorage fails, the UI warns the learner to keep the tab open.

Submissions are idempotent. Stored answer choices are scored; client score fields are ignored. Expired attempts finalize on the next read, save, dashboard load or submission, using the deadline as completion time. The UI countdown uses the server clock offset. Answers that never reached the server before expiry cannot be counted.

Active DTOs strip correct answers, explanations, transcripts, audio scripts and descriptive photograph alternatives. Parts 1/2 expose option letters only. Post-answer feedback is available only for a committed, locked answer in immediate focused practice. Full review requires submission and ownership.

## Audio and scoring

Focused/quick modes allow playback, replay, pause and seeking. Mock audio reserves one playback per linked unit before play, has no pause/seek controls, and remembers played units across resume. Navigating away or reloading consumes the playback; the same page can retry a failed media load. These are product playback policies, not proctoring or anti-cheat security.

All current results show raw counts and accuracy, including unanswered questions in the denominator. The original linear 5–495-per-section estimate remains only in private legacy regression code. It is not an ETS conversion and is not displayed.

History comparison keys separate mode, total count, per-part quotas, feedback policy and imported results. Practice questions differ even within a cohort. Recommendations require at least five answered observations in a part/skill within the latest 50 answers; accuracy below 70% qualifies, lowest accuracy wins, then specific skill and larger sample. The message reports the exact observations. No model or proficiency prediction is involved.

## Content and preservation

The bank contains 150 questions in 90 units, nine images and 64 MP3 clips. Quotas preserve the original 100-question simulation. The full 200-question mode remains disabled because quotas cannot be met without duplication.

Imports validate IDs, answer choices, explanations, tags, difficulties, grouping and local media, then hash exact unit content into deterministic UUIDs. Repeating an import does not duplicate it. Old attempt references retain their old version. An advisory lock serializes content imports.

Legacy browser records are imported only by explicit account action or JSON upload. Their IDs, original quotas, groups and answers are validated. Scores are recomputed, records deduplicated per owner, old data retained, and results marked Imported. Imported elapsed time is not known. Google login offers a separate consent action to add guest attempts without overwriting account history.

The original tracked source is recoverable at commit `2eb926b33883d6eb4d7784440a7c0a8b43f953e4` and in the ignored `.rebuild/original-2eb926f.zip`; the incoming uncommitted rebuild has a separate checkpoint. See rebuild-audit.md.

