# -------------------------------------------------------------
# Dockerfile for backend service
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . ./

RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --outDir dist/prisma --skipLibCheck --target es2021 --module commonjs --moduleResolution node

# -------------------------------------------------------------
# Production Runner
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate resolve --rolled-back 20261031221500_add_academic_structure_and_rls 2>/dev/null || true; npx prisma migrate deploy && node dist/prisma/seed.js && node dist/main"]
