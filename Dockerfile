# Stage 1: Build Frontend and Server Dependencies
FROM node:22-slim AS builder

WORKDIR /app

# Install pinned pnpm version matching lockfile
RUN npm install -g pnpm@9.15.0

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build frontend production bundle into dist/
RUN pnpm build

# Stage 2: Production Runner
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install pnpm for running the server script
RUN npm install -g pnpm@9.15.0

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
