# =============================================================================
# Multi-stage Dockerfile: Арена переговоров ОЭЗ «Алабуга»
# =============================================================================

# 1. Этап сборки (Builder)
FROM node:22-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package.json ./
RUN npm install --legacy-peer-deps

# Копирование исходного кода
COPY tsconfig.json vite.config.ts index.html metadata.json ./
COPY server.ts ./
COPY src/ ./src/
COPY public/ ./public/

# Сборка статики (Vite) и серверного бандла (esbuild)
RUN npm run build

# 2. Этап исполнения (Production Runner)
FROM node:22-alpine AS runner

WORKDIR /app

# Минимальные зависимости для работы продакшена
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Копирование собранных файлов из этапа builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Порт приложения
EXPOSE 3000

# Проверка работоспособности контейнера
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Запуск сервера
CMD ["node", "dist/server.cjs"]
