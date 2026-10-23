# ===================================================
# Stage 1: Build Client and Server
# ===================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy source codes
COPY client ./client
COPY server ./server

# Build Frontend & Backend
RUN cd client && npm run build
RUN cd server && npm run build

# ===================================================
# Stage 2: Production Runtime
# ===================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8090
ENV DATA_DIR=/app/data

# Install utilities: curl, wget, su-exec
RUN apk add --no-cache curl wget su-exec

# Copy server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy compiled backend
COPY --from=builder /app/server/dist ./server/dist

# Copy compiled frontend
COPY --from=builder /app/client/dist ./client/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create persistent data directory
RUN mkdir -p /app/data && chown -R node:node /app

EXPOSE 8090

VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8090/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
