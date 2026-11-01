# -------------------------------------------------------------
# Root Dockerfile for Coolify builds (Backend + Frontend SPA)
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

# 1. Install and build Backend
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN cd backend && npm ci

COPY backend/ ./backend/
RUN cd backend && npx prisma generate && npm run build
RUN cd backend && npx tsc prisma/seed.ts --outDir dist/prisma --skipLibCheck --target es2021 --module commonjs --moduleResolution node

# 2. Install and build Frontend SPA
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# -------------------------------------------------------------
# Production Runner
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl curl

COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && (node dist/src/main.js || node dist/main.js)"]
