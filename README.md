# Practice Desk

An offline-first, English-only TOEIC-style listening and reading practice application built with Next.js App Router, TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. A candidate name is the only required input. One active attempt and the latest immutable result are stored in browser `localStorage`; there is no account or database.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

The browser suite requires Playwright Chromium (`npx playwright install chromium`). Product behavior is documented in `UX-CONTRACT.md`; visual and interaction decisions are documented in `DESIGN.md`.

## Content and media

- `src/data/question-bank.ts` contains 150 original questions and their answer explanations.
- `public/images/questions` contains nine original optimized question photographs. Reproduction prompts are recorded in `scripts/image-prompts.md`.
- `public/audio` contains the bundled listening clips. Regenerate them with `npm run generate:audio`; the generator uses Microsoft Edge TTS voices and derives scripts directly from the typed question bank.

The 100-question generator selects exact blueprint quotas with a seeded randomizer while preserving passage and listening groups as atomic units.

## Scoring and security

Section scores are independently estimated from 5–495 in five-point increments, producing an explicitly unofficial 10–990 combined score. Correct answers and scoring are client-side for this offline MVP. A secure or proctored product must move question delivery, attempt validation, and scoring behind an authenticated server API.
