# Multi-stage Dockerfile for HireFlow
# This combines all services into a single deployable container

# Stage 1: Build the backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci --only=production
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Stage 2: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

# Stage 3: Final runtime image
FROM node:18-alpine AS runtime
WORKDIR /app

# Install necessary packages
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY backend/healthcheck.js ./backend/

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 5000

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/sh
# Start both backend and frontend services

# Start backend in background
cd /app/backend && npm start &

# Start frontend
cd /app/frontend && npm start
EOF

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["/app/start.sh"]
