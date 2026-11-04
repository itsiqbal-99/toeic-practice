FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/content/package.json packages/content/package.json
RUN npm ci
COPY . .
ARG API_INTERNAL_URL=http://127.0.0.1:4000
ENV API_INTERNAL_URL=$API_INTERNAL_URL
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/apps ./apps
COPY --from=build --chown=node:node /app/packages ./packages
USER node

FROM runtime AS api
ENV API_HOST=0.0.0.0
EXPOSE 4000
CMD ["node","apps/api/dist/main.js"]

FROM runtime AS web
EXPOSE 3000
CMD ["node","node_modules/next/dist/bin/next","start","apps/web","--hostname","0.0.0.0","--port","3000"]
