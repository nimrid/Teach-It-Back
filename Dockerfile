# Stage 1: Build Frontend and Server Dependencies
FROM node:23-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build frontend production bundle into dist/
RUN pnpm build

# Stage 2: Production Runner
FROM node:23-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy build artifacts and dependencies from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Persistent volume directory for SQLite
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3001

CMD ["pnpm", "start"]
