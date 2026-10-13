# ==========================================
# Multi-Stage Dockerfile for YouTube Clone API
# ==========================================

# Stage 1: Build & Dependencies
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install build dependencies and openssl for Prisma engine
RUN apk add --no-cache openssl libc6-compat

# Copy package descriptors
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN bun install --frozen-lockfile || bun install
RUN bun x prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Stage 2: Production Runtime
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Install runtime dependencies needed for Prisma OpenSSL engines
RUN apk add --no-cache openssl libc6-compat curl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies, Prisma engines, and code from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Ensure app directory permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "run", "src/index.ts"]
