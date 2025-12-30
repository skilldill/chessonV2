# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# --- Serve stage ---
FROM node:20-alpine

WORKDIR /app

# Устанавливаем serve глобально
RUN npm install -g serve

# Копируем собранные файлы
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Запускаем serve для раздачи статики
CMD ["serve", "-s", "dist", "-l", "3001"]