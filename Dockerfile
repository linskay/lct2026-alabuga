# =============================================================================
# Multi-stage Dockerfile: Арена переговоров ОЭЗ «Алабуга» (Kotlin Multiplatform Wasm)
# =============================================================================

# 1. Этап сборки (Gradle Builder)
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Установка Node.js для Wasm toolchain
RUN apk add --no-cache bash nodejs npm

# Копирование исходного кода и конфигураций
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle/ ./gradle/
COPY shared/ ./shared/
COPY web/ ./web/
COPY desktop/ ./desktop/
COPY app/ ./app/

# Сборка Wasm Web Distribution
RUN chmod +x gradlew && ./gradlew :web:wasmJsBrowserDistribution --no-daemon

# 2. Этап исполнения (Nginx Production Web Server)
FROM nginx:alpine AS runner

COPY --from=builder /app/web/build/dist/wasmJs/productionExecutable /usr/share/nginx/html

RUN printf '%s\n' \
'server {' \
'    listen 3000;' \
'    server_name localhost;' \
'' \
'    location / {' \
'        root /usr/share/nginx/html;' \
'        index index.html index.htm;' \
'        try_files $uri $uri/ /index.html;' \
'    }' \
'' \
'    types {' \
'        application/wasm wasm;' \
'        text/html html;' \
'        application/javascript js;' \
'        text/css css;' \
'        image/svg+xml svg;' \
'        application/json json;' \
'    }' \
'' \
'    location /api/health {' \
'        return 200 "{\"status\":\"ok\",\"mode\":\"kmp-wasm\"}";' \
'        add_header Content-Type application/json;' \
'    }' \
'}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
