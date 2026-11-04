# Development and deployment

## Local development

Use Node 22.13 or later, then `npm ci` and `npm run dev` at the repository root. Open http://127.0.0.1:3000. Without DATABASE_URL, a real embedded PostgreSQL engine stores development data in ignored `.local-db` and exposes a local wire-protocol connection on port 5434, pool size one. Nest runs on 4000, Next on 3000. Stop with Ctrl+C.

For an external development database, set DATABASE_URL in apps/api/.env. Development startup runs migrations and the repeatable seed. Copy .env.example only when configuring a real database; its URLs are placeholders. Never use a production database for tests.

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run content:validate`, `npm run build`. Install Playwright with `npx playwright install chromium` (CI: add `--with-deps`). Browser tests use a separate embedded database at .rebuild/e2e-db, API port 4001 and database port 5435. They require local loopback access. Integration tests use a fresh in-memory PostgreSQL engine on random local ports.

## Environment

| Variable | Purpose |
|---|---|
| DATABASE_URL | Application PostgreSQL URL; Neon pooled URL for deployed instances |
| DATABASE_DIRECT_URL | Direct PostgreSQL URL for migrations/imports |
| DB_POOL_SIZE | Connections per API instance, default 4; budget the total across replicas |
| WEB_ORIGIN | Exact public frontend origin, no trailing slash; HTTPS required in production |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google Web Application OAuth credentials, server only |
| GOOGLE_CALLBACK_URL | Exact public same-origin /api/v1/auth/google/callback URL |
| API_INTERNAL_URL | Private Nest origin used by the Next proxy; set before web build and at runtime |
| PORT / API_HOST | Nest listener, defaults 4000 / 127.0.0.1; containers need 0.0.0.0 |
| NODE_ENV | production in deployed services; enables Secure cookies and requires external DB |

No NEXT_PUBLIC secret or browser session token is needed. Keep all real values in the provider's secret manager. Never expose database or Google secrets to frontend bundles.

## Neon and migrations

Create a Neon development branch first. Use its pooled endpoint for API queries with a small pool. Use the direct endpoint for migrations and seed imports. TLS verifies certificates for nonlocal databases; sslmode from the URI is replaced by the explicit validated TLS setting. Neon documents the [pooler and connection considerations](https://neon.com/docs/connect/connection-pooling).

Set the real URLs in your shell/provider environment, then run:

```sh
npm ci
npm run build:packages
npm run db:migrate
npm run db:seed
```

Production can run the compiled commands after building:

```sh
node apps/api/dist/database/cli.js migrate
node apps/api/dist/database/cli.js seed
```

Migrations are versioned and transactional; automatic schema synchronization is disabled. Seed validates media relative to the repository/app layout, so include apps/web/public when running it. Run one migration job per deployment, before starting the new API. Take a database backup/Neon restore point before schema changes. Destructive down migration is deliberately unavailable.

## Google configuration

Create a Web Application OAuth client with the public callback URL exactly matching GOOGLE_CALLBACK_URL. Set consent screen details and test users where applicable. Use openid, email, profile only. The [Google server authorization flow](https://developers.google.com/identity/protocols/oauth2/web-server) describes redirect and consent requirements.

The integration uses Google Auth Library for code exchange and ID-token verification, state tied to the browser's current session, PKCE S256, a single-use 10-minute flow and nonce validation. Tokens from Google are not persisted. The app issues its own hashed, revocable 30-day session. Logout revokes it. Login creates/recognizes the stable subject and rotates the app session. Guest-attempt merging requires the learner's explicit action.

The browser must reach both UI and API at the same public origin. Keep the API private behind Next or an edge reverse proxy. Do not deploy unrelated frontend/API domains and rely on third-party cookies. If changing domains, plan the cookie boundary before rollout. Test real Google login, logout, expiry, callbacks and cross-device resume on Chrome, Edge and mobile before release.

## Hosting

Deploy a Node Next service and a persistent Node Nest service. GitHub Pages cannot host this backend. Keep the existing GitHub Pages app online until an explicitly approved replacement is verified; the workflow now validates code and does not deploy.

Build with `API_INTERNAL_URL=https://your-private-api-origin npm run build` using your provider's environment UI rather than shell-literal secrets. The rewrite destination is captured during the web build. Start Nest with `npm run start -w @toeic/api`, Next with `npm run start -w @toeic/web`. Configure HTTPS, WEB_ORIGIN and secure secret values. Bind API_HOST=0.0.0.0 where needed. If your edge proxy supplies an Origin header, preserve the browser's exact original Origin; do not replace it.

The Dockerfile provides `api` and `web` targets. Build both from the root, passing the private API origin as `--build-arg API_INTERNAL_URL=...`. Run migrations/seed once using the API image, then run each target as its own service. Docker is optional; the image definitions have not been daemon-built in this environment.

Health endpoints: /api/v1/health for process liveness and /api/v1/ready for database readiness. OpenAPI is on the API at /api/docs. The same-origin UI proxy covers /api/docs as well. Configure edge request limits/rate limits and monitoring for sign-in and guest creation before exposing a public deployment. Provider pricing/free-tier limits change; no claim of free production hosting is made.

## Rollback and retention

Retain the last verified API/web images and matching build-time proxy configuration. Roll back the services together; preserve schema compatibility. Restore a tested DB snapshot only through an explicit operational decision, since doing so can discard newer learner activity. Never drop/reseed a production database to recover a failed release.

Expired sessions are rejected on reads; schedule bounded deletion of expired app_sessions/oauth_states through your operations tooling. Guest workspaces expire when their cookie does; define an owner-approved retention policy before public release. Backup attempts/content versions and test restoration. Export in Account includes the visible result history, not credentials.

## Verification boundaries

Local PostgreSQL migrations, import, API calls, mocked Google code exchange and browser workflows can run without secrets. Actual Neon connectivity, Google consent, provider deployment, physical Samsung Internet/Edge devices and infrastructure failover need the deployment environment. Do not label those externally verified until they have been tested.

