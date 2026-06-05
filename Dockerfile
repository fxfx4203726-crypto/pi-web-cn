# ============================================================
# Stage 1: Build
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (caching layer)
COPY package.json package-lock.json ./
RUN npm ci --registry https://registry.npmjs.org/

# Copy source and build
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=30141

# Copy standalone output from builder
COPY --from=builder /app/.next-build/standalone ./
COPY --from=builder /app/.next-build/static ./.next-build/static
COPY --from=builder /app/public ./public

# Copy skills.zip if provided (optional, for global skill auto-install)
COPY skills.zip /tmp/skills.zip 2>/dev/null || true

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create pi agent data directory
RUN mkdir -p /root/.pi/agent/sessions /root/.pi/agent/skills

EXPOSE 30141

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
