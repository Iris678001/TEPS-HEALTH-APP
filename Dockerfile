# syntax=docker/dockerfile:1
###############################################################################
# SHRMS — School Health Record Management System
#
# Multi-stage build on oven/bun:1 (Bun understands bun.lock natively, so we
# can install with --frozen-lockfile and run prisma + next build without Node).
# The final image ships the Next.js STANDALONE output (next.config.ts →
# output: "standalone") plus the Prisma CLI/schema so the entrypoint can
# `db push` and (optionally) seed on first boot — fully offline.
#
# Build:  docker build -t shrms .
# Run:    docker run -d -p 3000:3000 -e JWT_SECRET=change-me shrms
###############################################################################

# ── Stage 1 · dependencies ───────────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
# Install ALL deps (incl. devDeps: prisma CLI, typescript) with a reproducible lockfile
RUN bun install --frozen-lockfile

# ── Stage 2 · build ──────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma Client before building (API routes import @prisma/client)
RUN bunx prisma generate
# package.json build script = `next build && cp -r .next/static .next/standalone/.next/
# && cp -r public .next/standalone/` → produces a self-contained .next/standalone bundle
RUN bun run build

# ── Stage 3 · runtime ────────────────────────────────────────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/db/custom.db \
    UPLOAD_DIR=/app/upload \
    SEED_ON_START=true \
    JWT_SECRET=change-me-in-production

LABEL org.opencontainers.image.title="SHRMS — School Health Record Management System" \
      org.opencontainers.image.description="Two-portal school health records: doctor/admin CRUD with JWT auth + read-only parent access via Admission No & DOB" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="."

# Next.js standalone server (server.js + traced node_modules + .next bundle).
# The build script already inlined .next/static and public into it; the two
# extra COPYs below are a safety net and make the image self-explanatory.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema + seed script (used by the entrypoint for db push / seeding)
COPY --from=builder /app/prisma ./prisma

# Prisma CLI + generated client + bcryptjs (seed dep) so the entrypoint can
# `db push` and seed at container start WITHOUT network access. The prisma
# CLI package is self-bundled; @prisma carries the engines, .prisma the
# generated client + query engine, .bin the `prisma` executable symlink.
COPY --from=builder /app/node_modules/prisma   ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin     ./node_modules/.bin
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Writable data dirs (mount volumes here — see docker-compose.yml)
RUN mkdir -p /app/db /app/upload

# ── Entrypoint: db push → optional seed → exec standalone server ─────────────
COPY <<'EOF' /usr/local/bin/docker-entrypoint.sh
#!/bin/sh
set -e

mkdir -p /app/db /app/upload

echo "[entrypoint] Syncing Prisma schema to $DATABASE_URL ..."
bunx prisma db push --accept-data-loss --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] SEED_ON_START=true -> reseeding demo data (prisma/seed.ts)..."
  echo "[entrypoint] NOTE: this wipes and re-creates demo records. Set SEED_ON_START=false for real data."
  bun prisma/seed.ts
else
  echo "[entrypoint] SEED_ON_START is not 'true' -> keeping existing data."
fi

echo "[entrypoint] Starting SHRMS on http://${HOSTNAME}:${PORT}"
exec bun .next/standalone/server.js
EOF
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ── Healthcheck: GET /api/auth/me (public route; 200 even when signed out) ───
COPY <<'EOF' /usr/local/bin/healthcheck.js
// Container HEALTHCHECK — runs under bun (no wget/curl needed in the image).
const port = process.env.PORT || 3000;
fetch(`http://127.0.0.1:${port}/api/auth/me`)
  .then((r) => process.exit(r.ok ? 0 : 1))
  .catch(() => process.exit(1));
EOF

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD ["bun", "/usr/local/bin/healthcheck.js"]

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
