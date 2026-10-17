FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
ARG NPM_REGISTRY=https://npm-mirror.gitverse.ru
RUN npm config set registry "$NPM_REGISTRY" && \
  npm ci \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=300000

COPY . .
ARG VITE_API_URL=/api/api
ARG VITE_WS_URL=/ws/room
RUN VITE_API_URL="$VITE_API_URL" VITE_WS_URL="$VITE_WS_URL" npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ARG NPM_REGISTRY=https://npm-mirror.gitverse.ru
RUN npm config set registry "$NPM_REGISTRY" && \
  npm install -g serve@14 \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=300000

COPY --from=builder /app/dist ./dist
EXPOSE 3003
CMD ["serve", "-s", "dist", "-l", "3003"]
