# syntax=docker/dockerfile:1.4
# ─── Stage 1: builder ────────────────────────────────────────────────────────
# Full install + prisma generate + next build.
# BuildKit cache mounts keep npm and Next.js caches between builds so that
# only changed files are recompiled on subsequent runs.
FROM node:18-alpine AS builder
WORKDIR /app

# Copy manifests first — Docker reuses this layer until package.json changes.
COPY package.json package-lock.json* ./

# --mount=type=cache persists the npm cache across builds (never downloaded twice).
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

# Generate Prisma client for the current platform.
RUN npx prisma generate

# NEXT_PUBLIC_* variables are inlined into the JS bundle at build time.
# Pass them via --build-arg so they are available during `next build`.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV DATABASE_URL=$DATABASE_URL

# Build Next.js in production mode with standalone output.
# --mount=type=cache persists .next/cache so incremental compilation works.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
# Minimal Alpine image — only the standalone bundle, static assets,
# Prisma schema/migrations, and the entrypoint script.
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone output: self-contained server + tree-shaken node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets (/_next/static) and public/ must be copied separately.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static  ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public

# Prisma schema + migrations for `prisma migrate deploy` at startup.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# The standalone bundle has a minimal node_modules. Override it with the full
# set from the builder so that the Prisma CLI and all its transitive deps
# (effect, @prisma/config, wasm files, etc.) are available at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
