# TOEIC Practice 2.0

A personal learning workspace with focused practice, quick tests, a shortened mock, saved attempts, explainable skill recommendations and answer review. The root opens the actual dashboard; a new visitor sees zero activity and useful first actions.

## Start

```sh
npm ci
npm run dev
```

Use Node 22.13+ (or Node 24). Open http://127.0.0.1:3000. No secrets or database installation are needed for guest development: an embedded PostgreSQL engine saves local data to ignored .local-db. Google login and Neon use environment configuration; see the examples in apps/api and apps/web.

## Architecture

- apps/web: Next.js 16.4.5, React 19.2, Tailwind 4, Radix, Motion, TanStack Query and Recharts.
- apps/api: NestJS REST, TypeORM/PostgreSQL migrations, Google Authorization Code + PKCE, hashed opaque cookie sessions and server scoring.
- packages/shared: public contracts; packages/content: private question bank and preserved generator.

All 150 questions, 90 linked units, nine photographs and 64 audio clips are preserved. Focused counts respect group boundaries. Quick tests offer 12/24 questions; the original 100-question format is a 60-minute shortened mock. A full 200-question mock remains disabled until the bank satisfies its quotas. Results use accuracy, never an invented official score.

## Check

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run content:validate
npm run build
```

Integration tests create an isolated PostgreSQL engine and mock Google token exchange. Browser tests exercise the real UI, Nest API and separate database on desktop/mobile Chromium. They need loopback networking. No production credentials are required.

## Persistence and migration

Server attempts retain exact question versions, answers, review flags, position and deadlines. Conflicts return 409 and require an explicit choice. Failed saves retain one pending edit in the browser and offer retry after reload. Guest identity lasts with its 30-day cookie; Google accounts provide cross-device history. Guest-to-account merging and legacy JSON import both require consent.

The original app remains recoverable in Git at 2eb926b33883d6eb4d7784440a7c0a8b43f953e4 and in the local ignored .rebuild archive. The incoming uncommitted rebuild was checkpointed before completion. The old GitHub Pages site has not been replaced; CI validates this server application without publishing it.

## Documentation

- [Assessment](docs/rebuild-audit.md)
- [Architecture, schema, scoring and audio policy](docs/architecture.md)
- [Local setup, environment, Google, Neon, deployment and rollback](docs/deployment.md)
- [API contracts](docs/api.md)
- [Content provenance](docs/content-provenance.md)
- [Design system](DESIGN.md) and [interaction contract](UX-CONTRACT.md)

Deployment needs a Next-compatible Node host, a Nest-compatible Node host and PostgreSQL/Neon. Docker targets are supplied. Actual Google/Neon and public deployment verification require real credentials and an approved deployment environment.
