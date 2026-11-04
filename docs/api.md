# API contracts

All application routes use /api/v1. Successful responses are the typed resource DTO; arrays and paginated collections have explicit shapes. Errors use `{error:{status,message}}`. 400 means invalid input, 403 a policy/CSRF violation, 404 an unavailable or other-user resource, 409 a stale revision/completed attempt, 503 a session/database outage. No SQL/credentials appear in user errors.

| Method | Route | Behavior |
|---|---|---|
| GET | /health, /ready | Process liveness and DB readiness; no guest session creation |
| GET | /auth/me | Restore cookie session or create guest identity |
| GET | /auth/google | Begin single-use Google code flow |
| GET | /auth/google/callback | Verify state, code, PKCE, nonce and identity; rotate app session |
| POST | /auth/logout | Revoke current app session and expire cookie |
| POST | /auth/merge-guest | Explicitly add offered guest attempts to Google account |
| PATCH | /users/preferences | `{goal:number|null,weeklyTarget:number}`; goal 1–100, target 5–500 |
| GET | /dashboard/overview | Real lifetime totals, samples, latest 200 results, active sessions, target and recommendation |
| GET | /assessments/blueprints | Catalog of valid group-preserving counts; optional difficulty, skill, replay=true |
| POST | /attempts | StartInput: focused/quick/mock, optional part/count/timed/immediate/difficulty/skill/replay |
| GET | /attempts | Paginated completed history: offset=0, limit=20 (max 100), optional mode; `{items,total,offset,limit}` |
| POST | /attempts/import | Consent import: `{kind:"active"|"result",data:legacyRecord}` |
| GET | /attempts/:id | Active public DTO and saved state, never answer keys |
| PATCH | /attempts/:id/answers/:questionId | `{revision,choiceId}` |
| PATCH | /attempts/:id/progress | `{revision,currentIndex?,markedQuestionIds?}` |
| POST | /attempts/:id/audio/:unitId | `{revision}`; reserve strict audio playback |
| POST | /attempts/:id/submit | Idempotently score stored answers; client score claims have no effect |
| GET | /attempts/:id/results | Completed immutable Result DTO |
| GET | /attempts/:id/review | Completed Attempt DTO including explanations/keys/transcripts |
| GET | /attempts/:id/feedback/:questionId | Locked answer feedback in immediate focused mode |
| GET | /insights/skills, /insights/history, /practice/recommendations | Derived workspace views |

All learner routes are scoped by the opaque session cookie. Guest access is an isolated backend identity, not authorization to see another guest's data. Mutations must send the browser's exact WEB_ORIGIN plus X-Toeic-Client: 1. The browser API client serializes initial session establishment before sending parallel queries.

Mock always has 100 unique questions and a 60-minute enforced deadline. Quick is 12 or 24, optionally timed at one minute per question. Focused is untimed, with metadata filters and reachable counts advertised by the catalog. Full 200 is unavailable. Part 7 has separate single/multiple-document bank categories while retaining TOEIC part number 7.

The Swagger UI at /api/docs describes operation paths and mutation bodies. Shared DTO interfaces and this document specify response contracts; Swagger is not a generated client SDK.
