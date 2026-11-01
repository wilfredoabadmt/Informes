# -------------------------------------------------------------
# Root Dockerfile for Coolify builds
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci

COPY backend/ ./

RUN npx prisma generate
RUN npm run build

# -------------------------------------------------------------
# Production Runner
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
