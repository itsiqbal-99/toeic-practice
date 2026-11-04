# UX contract

Audience: adult English learners. English-only UI. Dates display in the browser locale; all stored timestamps are UTC, and weekly practice starts Monday 00:00 UTC. Accessibility target: WCAG 2.2 AA.

## Route and state ownership

| Capability | Canonical owner |
|---|---|
| Dashboard, progress, recent activity | Nest ProgressService; TanStack Query caches public DTOs |
| Practice configuration | Catalog advertises actual grouped availability after filters |
| Active question and saved answers | Nest AttemptService; useAttempt preserves one pending local edit |
| Listening | AudioPlayer, keyed by linked stimulus group |
| Dialogs and drawers | Shared Radix Dialog with focus restoration |
| Results and review | Immutable server result and ownership-protected review DTO |
| Account/targets | Backend identity/session and preferences |

Root / renders the dashboard. /practice configures focused or quick sessions; /mock-tests configures the shortened mock. /test is a dedicated examination shell. /progress, /review, /account, /results and /results/review use the workspace shell. Results/tests use an opaque attempt query parameter, always checked for ownership on the server.

## Flow ledger

| Action | Pending | Success | Failure and focus |
|---|---|---|---|
| Start | Stable busy button | Open saved server attempt | Inline configuration error; preserve selections |
| Answer | Optimistic selection, local pending record, Saving status | Revision returned, local record removed, Saved status | Keep pending record; Retry save or explicitly use server state |
| Navigate/mark | Same revision and save boundary | Restore exact index/flags | Conflict cannot silently overwrite another device |
| Resume | Load saved attempt and pending edit | Exact question and audio policy | Retry or return to dashboard; no data deletion |
| Submit | Confirm answered/unanswered/marked counts; button busy | Idempotent server score; results route | Keep dialog actionable, display error |
| Expire | Countdown reaches zero | Server finalizes saved answers at deadline | Retry reads on reconnect; late unsynced answers are not accepted |
| Review | Fetch only after submission | Filters show original stimuli and explanations | Contextual retry; no premature keys |
| Google login | Backend state/PKCE/nonce flow | Recognize/create account and rotate session | Safe sign-in error; guest practice remains available |
| Merge/import | Explicit user action and busy status | Add deduplicated history, preserve originals | Invalid records remain untouched and get actionable error |

## Interaction rules

Position does not imply completion. A learner on Question 80 with no answers has zero answered progress. Radio groups use native arrow/Space behavior, selected letter/check/border and visible focus. A committed immediate-feedback answer is locked; deferred modes reveal keys only after final submission.

The desktop answer sheet is persistent; mobile opens it as a modal drawer. Submission closes the navigator first. Confirmation initially focuses Return to test. Escape returns to the initiating control where it remains mounted. Sticky footers never cover the last question or focused controls.

Reading documents retain their group. Desktop passages use a readable side column; mobile presents full-width text above associated questions. Listening groups retain one player across linked questions. On unit change, the player unmounts and stops. Media errors are inline and do not prevent answering.

Mock audio is one playback per group without pause/seek/replay; reload/navigation consumes its reservation. The player permits a same-page retry after an actual playback failure. This is disclosed as a practice policy, never a claim of examination security.

## Resilience

The database is authoritative. Browser storage contains only one pending edit per attempt and untouched legacy records, never OAuth secrets or application session tokens. Local storage denial produces a visible warning. Network interruption retains the pending edit; a refresh offers retry. A stale revision requires explicit resolution. Beforeunload warns when an edit is unsynced.

The server uses ownership predicates, row locks, immutable completed results, content-version references and idempotent submit. No client score is trusted. Guest cookies last 30 days; account sessions support revocation/logout. Google sign-in never silently moves guest attempts.

## Intelligence and truthfulness

All chart points and metrics come from actual stored results. Empty dashboards have no invented statistics. Answered questions and full-result accuracy use clearly distinct denominators. Recommendations use at least five recent answered observations and state the actual reason. History lines separate mode, quotas, count, timing, feedback and imported provenance. Imports do not become comparable assessed results.

No official TOEIC estimate, readiness claim or paid/local AI model is used. A 200-question simulation is unavailable until content quotas can be satisfied without duplication.

## Verification

Preserve legacy generator/scoring/storage/provider regressions. Test current selection, redaction, score integrity, ownership, state/PKCE/nonce, session expiry/logout, consent merge, content import/versioning, conflicts, timers, retry/resume and immutable results against a real PostgreSQL engine. Playwright exercises the integrated app on desktop/mobile Chromium, keyboard, reduced motion, media errors and axe. Record physical-browser and external-credential checks separately.
