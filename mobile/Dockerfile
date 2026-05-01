# syntax=docker/dockerfile:1.4

# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Cypress во время установки качает отдельный бинарник.
# Для production build он не нужен.
ENV CYPRESS_INSTALL_BINARY=0

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
  npm config set registry https://registry.npmjs.org/ && \
  npm ci --verbose \
    --legacy-peer-deps \
    --no-audit \
    --no-fund \
    --fetch-retries=10 \
    --fetch-retry-mintimeout=30000 \
    --fetch-retry-maxtimeout=300000 \
    --fetch-timeout=600000

COPY . .

RUN npm run build


# --- Serve stage ---
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3001