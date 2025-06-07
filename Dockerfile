# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY web/package.json ./web/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Build the application
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY web/package.json ./web/

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the backend
RUN pnpm run build

# Build the frontend
RUN cd web && pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/.next ./web/.next
COPY --from=builder /app/web/public ./web/public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/web/package.json ./web/package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/web/next.config.js ./web/next.config.js

# Copy environment file template
COPY .env.example .env.example

# Create logs directory
RUN mkdir -p logs && chown nodeuser:nodejs logs

# Change ownership of the app directory
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose the ports
EXPOSE 3001 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3001, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start script that runs both backend and frontend
COPY --from=builder /app/scripts/start-production.sh ./scripts/
RUN chmod +x ./scripts/start-production.sh

# Start the application
CMD ["./scripts/start-production.sh"]
