FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm config set registry "$NPM_REGISTRY" && \
  npm ci \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=300000

COPY . .
ARG PUBLIC_SITE_URL=https://xn----7sbab9bkekdf6b7a0b9b.xn--p1ai
RUN PUBLIC_SITE_URL="$PUBLIC_SITE_URL" npm run build

FROM httpd:2.4-alpine AS runtime
COPY --from=build /app/dist /usr/local/apache2/htdocs/
EXPOSE 80
CMD ["httpd-foreground", "-c", "ErrorDocument 404 /404.html"]
