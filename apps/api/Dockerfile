# syntax=docker/dockerfile:1
# Build context is the REPO ROOT (pnpm workspace lives above apps/api).
#   docker build -f apps/api/Dockerfile .
# or, on GCP:
#   gcloud run deploy zporter-api --source . (with apps/api/Dockerfile picked up)

FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo

# ---- install deps + build ---------------------------------------------------
FROM base AS build

# argon2 has no prebuilt binary for this image → it compiles from source.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Manifests first so the dependency layer caches across source-only changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @zporter/api... --filter @zporter/shared...

# Now the sources.
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @zporter/shared build \
 && pnpm --filter @zporter/api build

# Flatten @zporter/api into a self-contained prod bundle at /out
# (real folders instead of workspace symlinks; dev deps stripped).
RUN pnpm --filter @zporter/api deploy --prod /out

# ---- runtime --------------------------------------------------------------
FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Non-root.
USER node

COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist

# Cloud Run injects PORT (8080). main.ts reads process.env.PORT.
EXPOSE 8080
CMD ["node", "dist/main.js"]
