# UX Contract

## Product context

- Audience: adult English learners and test candidates.
- Primary jobs: start or resume an attempt, answer and review 100 questions, submit deliberately, understand performance.
- Target market: global English-language MVP.
- Active locale: `en`.
- Timezone/calendar policy: timestamps are stored as ISO strings and shown in the browser locale; no calendar workflow.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

The current user-approved implementation plan is the only authoritative product source. There are no permission, billing, deletion, legal, or external side-effect domains in v1.

## Visual contract

- Project source: `DESIGN.md`.
- Token ownership: DESIGN.md authored; `src/app/globals.css` is the direct runtime mapping.
- Supported theme: light only, plus forced-colors compatibility.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | Shared `TextField` and landing form | This contract | candidate start | integration + E2E |
| Scrollbar | `src/app/globals.css` | `DESIGN.md` | stable-gutter geometry | browser computed style |

Radix Dialog owns every modal and drawer. `Button` owns action emphasis, intent, busy, and disabled states. `TestSessionProvider` owns the active attempt and persistence. `AudioPlayer` owns all listening playback state.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Failure recovery | Focus outcome |
|---|---|---|---|---|---|
| Start | Start practice test | stable busy button | `/test` | inline name/session error | test heading |
| Resume | Resume test | stable busy button | `/test` | corrupt-session recovery | test heading |
| Replace | Start a new test | dialog action busy | `/test` | dialog remains actionable | test heading |
| Submit | Submit test | stable dialog action | `/results` | dialog remains open | result heading |
| Review | Review answers | route navigation | `/results/review` | result recovery route | review heading |

## Navigation and responsive behavior

- Titles use `{Page} — Practice Desk`.
- Missing/corrupt test or result data renders a recovery state with a link to the landing route.
- Desktop keeps the question navigator in a sticky rail. Below 64rem it becomes a modal right drawer; the same state and labels are preserved.
- Previous/next controls remain reachable and never cover focused content.

## Overlays and feedback

- Radix Dialog provides accessible naming, focus trap, Escape, scroll lock, and focus restoration.
- Submission is consequential but not destructive: initial focus is Return to test.
- Replacing an active attempt is destructive to local progress: the dialog names that consequence and initially focuses Keep current test.
- Layer order: sticky 100, backdrop 500, dialog/drawer 600, toast 900. Submission is never opened over the question drawer.

## Async and resilience

- No server mutations exist. Session writes are synchronous local persistence guarded by `try/catch`.
- One active attempt and one latest result are stored with a schema version. Invalid data is ignored and removed only after showing a recoverable status.
- Answers persist immediately. Cross-tab storage changes refresh the local snapshot on the next navigation/reload; concurrent editing is not supported.
- Media errors are scoped inline and never block answering or navigation.

## Validation

- Name validation runs on start, then on change while invalid.
- The form uses `noValidate`, a visible label, `aria-invalid`, associated correction text, and first-invalid focus.
- Duplicate starts and submissions are blocked without changing button geometry.

## Verification

- Static: ESLint, TypeScript, Vitest, premium strict audit, DESIGN lint, anti-pattern searches.
- Browser: Playwright desktop and iPhone 13 profiles, axe, keyboard-only dialogs/navigation, reduced motion, long content, corrupt storage, media errors.
- Visual: landing, each renderer class, submission, results, and review at narrow and wide widths.
