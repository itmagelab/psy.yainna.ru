#!/usr/bin/env bash
# ==========================================================================
# Работа с контейнером сайта: сборка, запуск, публикация в GitHub Packages.
#
#   ./scripts/container.sh build    собрать локальный образ
#   ./scripts/container.sh run      собрать и запустить на http://localhost:8080
#   ./scripts/container.sh login    авторизоваться в ghcr.io
#   ./scripts/container.sh push     собрать и отправить образ в Packages
#   ./scripts/container.sh shell    зайти внутрь контейнера
#   ./scripts/container.sh logs     логи Caddy
#   ./scripts/container.sh check    проверить, что собранный сайт живой
#
# Переменные окружения:
#   IMAGE    имя образа (по умолчанию ghcr.io/itmagelab/psy.yainna.ru)
#   TAG      тег (по умолчанию latest)
#   DOMAIN   домен для проверки
#   SITE_URL адрес для canonical/OG (по умолчанию https://$DOMAIN)
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOMAIN="${DOMAIN:-psy.yainna.ru}"
IMAGE="${IMAGE:-ghcr.io/itmagelab/psy.yainna.ru}"
TAG="${TAG:-latest}"
SITE_URL="${SITE_URL:-https://${DOMAIN}}"
BASE_PATH="${BASE_PATH:-/}"
CONTAINER="${CONTAINER:-psy}"
VOLUME_DATA="${VOLUME_DATA:-psy-caddy-data}"
VOLUME_CONFIG="${VOLUME_CONFIG:-psy-caddy-config}"
PLATFORM="${PLATFORM:-}"

if ! command -v podman >/dev/null 2>&1; then
	echo "podman не найден. Установите podman 4+ и перезапустите машину: podman machine init" >&2
	exit 1
fi

# Формат docker нужен, иначе podman выбрасывает HEALTHCHECK из образа.
build_args=(--format docker --build-arg "SITE_URL=${SITE_URL}" --build-arg "BASE_PATH=${BASE_PATH}")
[[ -n "$PLATFORM" ]] && build_args+=(--platform "$PLATFORM")

cmd_build() {
	echo "▸ Сборка ${IMAGE}:${TAG} (SITE_URL=${SITE_URL}, BASE_PATH=${BASE_PATH})"
	podman build "${build_args[@]}" -t "${IMAGE}:${TAG}" -f Containerfile .
}

cmd_login() {
	echo "▸ Вход в ghcr.io"
	echo "   Токен нужен со scope write:packages."
	echo "   Создать: gh auth refresh -h github.com -s write:packages"
	podman login ghcr.io -u "${GH_USER:-$(gh api user --jq .login)}" -p "$(gh auth token)"
}

cmd_push() {
	cmd_login
	echo "▸ Сборка и отправка linux/amd64"
	podman build "${build_args[@]}" --platform linux/amd64 \
		--tag "${IMAGE}:amd64" -f Containerfile .
	podman push "${IMAGE}:amd64"

	echo "▸ Сборка и отправка linux/arm64"
	podman build "${build_args[@]}" --platform linux/arm64 \
		--tag "${IMAGE}:arm64" -f Containerfile .
	podman push "${IMAGE}:arm64"

	echo "▸ Сборка манифеста ${IMAGE}:${TAG}"
	podman manifest rm "${IMAGE}:${TAG}" >/dev/null 2>&1 || true
	podman manifest create "${IMAGE}:${TAG}" "${IMAGE}:amd64" "${IMAGE}:arm64"
	podman manifest push --all "${IMAGE}:${TAG}" "docker://${IMAGE}:${TAG}"

	echo "✓ Образ в Packages: https://github.com/orgs/itmagelab/packages/container/package/${IMAGE##*/}"
	echo
	echo "  Сборка arm64 на машине с amd64 требует binfmt (qemu-user-static)."
	echo "  Обычно проще публиковать из CI: .github/workflows/container.yml"
}

cmd_run() {
	cmd_build
	echo "▸ Запуск ${CONTAINER}"
	podman rm -f "$CONTAINER" >/dev/null 2>&1 || true
	podman volume exists "$VOLUME_DATA" || podman volume create "$VOLUME_DATA"
	podman volume exists "$VOLUME_CONFIG" || podman volume create "$VOLUME_CONFIG"

	podman run -d --name "$CONTAINER" \
		-p 8080:8080 -p 8443:8443 \
		-e "DOMAIN=${DOMAIN}" \
		# ACME_EMAIL не передаём, если он пуст: см. комментарий в Caddyfile \
		-v "${VOLUME_DATA}:/data" \
		-v "${VOLUME_CONFIG}:/config" \
		"${IMAGE}:${TAG}"

	echo "▸ Локально: http://localhost:8080 (сертификат для localhost Caddy выпустит сам)"
	echo "  Проверка: curl -I http://localhost:8080/healthz"
}

cmd_check() {
	local tag="${1:-$TAG}"
	echo "▸ Проверка ${IMAGE}:${tag}"
	podman run --rm --entrypoint sh "${IMAGE}:${tag}" -c '
		set -e
		test -f /srv/index.html
		test -f /srv/og.png
		test -f /srv/404.html
		test -f /srv/privacy/index.html
		test -f /srv/consent/index.html
		echo "  файлы на месте"
		echo "  размер статики: $(du -sh /srv | cut -f1)"
	'
	echo "✓ Образ в порядке"
}

cmd_shell() { podman exec -it "$CONTAINER" sh; }
cmd_logs() { podman logs -f "$CONTAINER"; }

case "${1:-}" in
build) cmd_build ;;
run) cmd_run ;;
login) cmd_login ;;
push) cmd_push ;;
check) cmd_check "${2:-}" ;;
shell) cmd_shell ;;
logs) cmd_logs ;;
*)
	echo "Неизвестная команда: ${1:-}" >&2
	grep -E '^#   \./scripts/container\.sh' "$0" >&2
	exit 1
	;;
esac
