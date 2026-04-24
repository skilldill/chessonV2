FROM node:lts AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000 \
  --fetch-timeout=300000
COPY . .
RUN npm run build

FROM httpd:latest AS runtime
COPY --from=build /app/dist /usr/local/apache2/htdocs/
EXPOSE 80
