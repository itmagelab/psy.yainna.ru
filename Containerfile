# ==========================================================================
# Контейнер с собранным сайтом.
#
# Синтаксис одинаков для podman build и docker build.
#   podman build -t psy:local .
#   podman build -t ghcr.io/itmagelab/psy.yainna.ru:latest .
#
# Многослойная сборка: Node только нужен на этапе сборки, в образ попадает
# чистая статика + Caddy. Итоговый образ — около 60 МБ.
# ==========================================================================

ARG NODE_IMAGE=docker.io/library/node:24-alpine
ARG CADDY_IMAGE=docker.io/library/caddy:2.11-alpine

# --- Этап 1: сборка статического сайта ------------------------------------

FROM ${NODE_IMAGE} AS build

WORKDIR /app

# Зависимости отдельным слоем: правка контента не пересобирает node_modules.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Адрес публикации влияет на canonical, og:image, sitemap и robots.txt.
ARG SITE_URL=https://psy.yainna.ru
ARG BASE_PATH=/
ENV SITE_URL=${SITE_URL} \
    BASE_PATH=${BASE_PATH} \
    NODE_ENV=development \
    CI=true

RUN npm run build \
    # Память: sharp и Astro любят запас при сборке в контейнере
    && node --max-old-space-size=2048 -e "1" \
    # Контроль: без этих файлов образ бессмысленен
    && test -f dist/index.html \
    && test -f dist/og.png \
    && test -f dist/404.html

# --- Этап 2: рантайм со статикой и Caddy ----------------------------------

FROM ${CADDY_IMAGE} AS runtime

LABEL org.opencontainers.image.title="psy.yainna.ru" \
      org.opencontainers.image.description="Лендинг психотерапевта в гештальт-подходе" \
      org.opencontainers.image.vendor="itmagelab" \
      org.opencontainers.image.source="https://github.com/itmagelab/psy.yainna.ru" \
      org.opencontainers.image.url="https://psy.yainna.ru" \
      org.opencontainers.image.licenses="UNLICENSED"

# ACME_EMAIL намеренно не задан: Caddy подставляет значение по умолчанию
# только для незаданной переменной, а пустая строка ломает конфигурацию.
ENV DOMAIN=psy.yainna.ru \
    HTTP_PORT=8080 \
    HTTPS_PORT=8443

COPY --from=build /app/dist /srv
COPY deploy/caddy/Caddyfile /etc/caddy/Caddyfile

# Каталоги для сертификатов и служебных файлов: должны быть на volumes,
# иначе при каждом перезапуске выпускаются новые сертификаты.
VOLUME ["/data", "/config"]

# Порты по умолчанию непривилегированные: так контейнер запускается под
# rootless podman без sysctl. Внешние порты пробрасываются 80→8080, 443→8443.
EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${HTTP_PORT:-8080}/healthz" || exit 1
