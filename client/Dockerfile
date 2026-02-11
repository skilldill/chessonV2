# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# --- Serve stage ---
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy build artifacts
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Run serve to host static files
CMD ["serve", "-s", "dist", "-l", "3000"]