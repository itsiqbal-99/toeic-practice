# TOEIC Practice 2.0 — baseline audit

Assessed 3 November 2026, before production-source changes. Baseline commit: `2eb926b33883d6eb4d7784440a7c0a8b43f953e4` (see `git log` for the exact recoverable source). A full tracked-source archive is in `.rebuild/original-2eb926f.zip`; the pre-existing `next-env.d.ts` development change is separately preserved. No remote changes or deployment are authorized.

## Architecture and dependencies

Next 16.3.3 App Router, React 19.2, strict TypeScript, Tailwind 4, Radix Dialog, Lucide, IBM Plex and Source Serif fonts. Static export and `/toeic-practice` base path support GitHub Pages. There is no API, account, database, or secure assessment boundary. Routes: `/`, `/test`, `/results`, `/results/review`. TestSessionProvider imports the complete question bank, seeded generator, and scorer into the client. localStorage holds one active session and one latest result, schema version 1.

## Validated content and functionality

150 questions: photographs 9; question-response 21; conversations 24; talks 21; incomplete sentences 30; text completion 15; single passage 15; multiple passages 15. Linked question units are atomic. The 100-question blueprint selects 50 listening and 50 reading questions without duplication, with quotas 6/14/15/15/20/12/9/9. Nine WebP photographs and 64 MP3 clips are present and covered by asset checks. Explanations, difficulty, seven validated skill tags, transcripts, and grouped documents are worth preserving. Parts 1 and 2 already hide choice text visually, but the text remains in the delivered JavaScript. The player allows unlimited replay and seeking; no timer exists.

## UX findings

Root is a candidate-name briefing, not a learning workspace. No historical progress, practice configuration, weak-skill recommendations, account, goals, or mistake replay. Test workspace hard-codes 100 questions. Its progress bar measures question position instead of answered questions. Reading renderer supports side-by-side passages and questions; mobile navigation and Radix dialogs are useful patterns to preserve. Audio errors are scoped to the player. Refresh restores local answers but concurrent writes have no revision control. Replacing an attempt loses that attempt; a new result replaces the previous result.

## Technical and security findings

The linear section estimate `5 + 490 * correct/total`, rounded to five points, is explicitly unofficial but cannot establish TOEIC proficiency. The rebuild will show raw accuracy rather than retain unsupported readiness bands. Client answer keys and local scores are editable and unsuitable for server assessments. Stored records have shallow validation; corrupt data must never be silently treated as valid. No external user input reaches a backend in the baseline. New trust boundaries require DTO validation, ownership checks, server timestamps, concurrency control, CSRF/origin checks, opaque HttpOnly sessions, and immutable transactional results. Browser playback limits cannot supply examination anti-cheat security.

## Tests and behavior verification

Baseline: 14/14 Vitest tests pass (quotas, uniqueness, groups, deterministic generation, insufficient bank, scoring boundaries, assets, storage, provider persistence). Playwright scenarios cover starting, refresh/resume, incomplete submit/review, mobile navigator, corrupt storage, base-path media, and axe. Baseline browser execution initially blocked by missing Playwright Chromium; existing webServer configuration also mismatches the loopback host. Install a workspace-local browser and correct test orchestration during the rebuild. Production URL could not be fetched by the web tool; no claim of production visual verification is made.

## Migration and preservation

Move the frontend into `apps/web`, private typed content and preserved generator into `packages/content`, contracts into `packages/shared`, and Nest into `apps/api`. Keep every media file byte-for-byte. Import content with deterministic IDs and content hashes; retain immutable versions used by attempts. Repeated imports must not duplicate rows. Preserve original source in Git and the ignored archive. Old localStorage keys stay untouched. Offer explicit import into the guest/account history, validate original question references and choices, recompute scores on the server, and label imported history. Google account linking must ask for consent before moving guest attempts. Never overwrite account history.

## Implementation decisions

Use npm workspaces and the existing lockfile/toolchain; pnpm is not required for workspace isolation. Retain Next 16.3.3. Nest REST `/api/v1`, TypeORM with explicit SQL migrations, PostgreSQL, Google Authorization Code + PKCE through a vetted OAuth library, database-backed sessions. Same-origin Next proxy avoids third-party cookies. A local embedded PostgreSQL development/test option is justified because neither Docker nor PostgreSQL binaries or Neon credentials are available. Production requires an explicit Neon URL and must never silently fall back. Only real API-derived dashboard metrics; small samples clearly labeled. Recommendations require at least five observations. Focused, quick, and 100-question mock modes share a group-preserving selection engine. Full 200-question mock remains disabled because content quotas cannot be met.

## Design and risks

Replace teal examination paper with warm porcelain, cobalt, charcoal, apricot, Manrope and restrained editorial serif. App sidebar, compact mobile nav, dedicated exam shell, accessible radio groups, readable document columns, thoughtful empty states, and reduced-motion-aware entry/selection/overlay transitions. Preserve Radix and Lucide rather than invent replacements.

No environment secrets are present. Live Google login and Neon connectivity cannot be externally verified without credentials. Content is described as original in README and image prompt records; no independent license evidence establishes redistribution rights for generated photographs or Edge TTS audio, so record provenance and require owner review before a commercial deployment. Existing GitHub Pages deployment must remain online; replace automatic Pages deployment with validation-only CI for the rebuild so a future push cannot deploy a server app as static HTML.

## Change reach

All page routes, layout/providers, test setup/workspace/player/navigation, results/review, persistence and analytics, content tooling, package/config paths, unit and E2E fixtures, CI, environment examples, and deployment docs. Preserve source content, media, original generation/scoring regression tests and accessible shared primitives. No paid services, public deployment, destructive database operations, or unrelated files.

## Completion assessment — 4 November 2026
The incoming workspace already contains an uncommitted monorepo rebuild; it is preserved in .rebuild/checkpoint-sources-before-completion-20261104.zip in addition to the original Git archive. Type checking passes. Unit tests cannot resolve legacy imports after migration; lint includes generated output and reports audio ref/state issues; E2E tests still assume the old base path and candidate form. Fix scope includes first-request guest identity races, filtered content availability, audio replay transitions, offline persistence recovery, explicit legacy import, deterministic skill recommendations, history comparisons, integration coverage, CI, and deployment documentation. No credentials were found or exposed; live Google and Neon verification remains external.

## Dependency security correction
The completion audit found current critical Next.js advisories covering 16.3.3 (including GHSA-2464-fhr4-w9xw and GHSA-673q-mjm6-r5xr), so preserving that version is not practical. The web application and matching ESLint configuration were updated to patched 16.4.5, with dependency remediation and fresh verification. See docs/verification.md for the final audit result. The original archive remains unchanged.

Patched dependency set: Next 16.4.5, Nest 11.2.8, TypeORM 1.1.2, Vitest 5.1.0, Zod 4.6.7. Narrow same-major overrides update Nest's pinned multer and js-yaml dependencies to their security patches, avoiding an unnecessary Nest major migration. TypeORM/Vitest major upgrades are justified by security advisories and covered by the integration/regression suite. Node minimum is 22.13.0.
