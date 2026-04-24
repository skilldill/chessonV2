# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

RUN npm config set registry https://registry.npmmirror.com && \
  npm ci \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=300000
RUN npm run build

# --- Serve stage ---
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm config set registry https://registry.npmmirror.com && \
  npm install -g serve \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=300000

# Copy build artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run serve to host static files
CMD ["serve", "-s", "dist", "-l", "3000"]
