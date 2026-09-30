# Контейнер с собранным сайтом. Список команд: just --list
#
# Переменные окружения: TAG (latest), DOMAIN, SITE_URL, HTTP_PORT (8088).
# SITE_URL попадает внутрь образа и влияет на canonical, og:image,
# sitemap и robots.txt — задавайте его при сборке на свой домен.
#
# Мультиплатформенный образ (amd64 + arm64) публикует CI:
# .github/workflows/container.yml. Здесь собирается платформа текущей
# машины, чего достаточно для локальной проверки.

set shell := ["bash", "-uc"]

image := "ghcr.io/itmagelab/psy.yainna.ru"
tag := env_var_or_default("TAG", "latest")
# Адрес для локального запуска. Схема http:// отключает редирект на HTTPS
# и выпуск сертификата: для локальной проверки это лишнее.
local_domain := env_var_or_default("DOMAIN", "http://localhost")
# Адрес, зашитый в образ: попадает в canonical, og:image, sitemap, robots.
site_url := env_var_or_default("SITE_URL", "https://psy.yainna.ru")
# Порт на хосте для локального запуска. 8080 на машине часто занят
# (например, gvproxy из podman machine), поэтому по умолчанию 8088.
http_port := env_var_or_default("HTTP_PORT", "8088")
https_port := env_var_or_default("HTTPS_PORT", "8443")

# Формат docker обязателен: в формате OCI podman выбрасывает HEALTHCHECK.
build_args := "--format docker --build-arg SITE_URL=" + site_url + " --build-arg BASE_PATH=/"

_default:
    @just --list

# Собрать образ для платформы текущей машины
build:
    podman build {{build_args}} -t {{image}}:{{tag}} -f Containerfile .

# Собрать и запустить локально на :8088 (обычный HTTP, без сертификата)
run: build
    podman rm -f psy >/dev/null 2>&1 || true
    podman volume exists psy-caddy-data || podman volume create psy-caddy-data
    podman volume exists psy-caddy-config || podman volume create psy-caddy-config
    podman run -d --name psy -p {{http_port}}:8080 -p {{https_port}}:8443 -e DOMAIN={{local_domain}} -v psy-caddy-data:/data -v psy-caddy-config:/config {{image}}:{{tag}}
    @echo
    @echo "сайт: http://localhost:{{http_port}}, проверка: http://localhost:{{http_port}}/healthz"

# Остановить и удалить контейнер (тома с сертификатами остаются)
down:
    podman rm -f psy

# Проверить, что в образе лежит собранный сайт
check tag=tag:
    podman run --rm --entrypoint sh {{image}}:{{tag}} -c 'ls /srv/index.html /srv/og.png /srv/404.html /srv/privacy/index.html /srv/consent/index.html >/dev/null && du -sh /srv'

# Отправить образ в GitHub Packages (нужен scope write:packages у токена)
push:
    podman login ghcr.io -u "$(gh api user --jq .login)" -p "$(gh auth token)"
    just build
    podman push {{image}}:{{tag}}
    @echo "https://github.com/orgs/itmagelab/packages/container/package/psy.yainna.ru"
