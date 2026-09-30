# Развёртывание на своём хостинге

Сайт собирается в статику, поэтому в контейнере нет ни Node, ни сборщика:
только Caddy, который раздаёт файлы и сам выпускает сертификаты.

- **`Containerfile`** — сборка в два этапа: Node собирает сайт, в образ
  попадает чистая статика с Caddy.
- **`deploy/caddy/Caddyfile`** — раздача, кеширование, заголовки, 404.
- **`compose.yaml`** — запуск на сервере.
- **`scripts/container.sh`** — сборка, запуск, публикация образа.

---

## 1. Быстрый старт

```bash
# Собрать и запустить локально
./scripts/container.sh run
curl -I http://localhost:8080/healthz

# Остановить
podman rm -f psy
```

Локально Caddy выпускает сертификат для `localhost` сам, внешние проверки
не нужны.

## 2. На сервере

### 2.1 Требования

Docker или podman 4+, открытые порты 80 и 443, домен уже направлен на
сервер. Сертификат Let's Encrypt выпускается автоматически при первом
запуске и обновляется за месяц до истечения.

### 2.2 Запуск

```bash
# Скачать образ из GitHub Packages
podman pull ghcr.io/itmagelab/psy.yainna.ru:latest

# Или собрать из исходников
git clone git@github.com:itmagelab/psy.yainna.ru.git && cd psy.yainna.ru
podman build -t psy:local .

# Запустить
podman run -d --name psy \
  -p 80:8080 -p 443:8443 \
  -e DOMAIN=psy.yainna.ru \
  -e ACME_EMAIL=ваша@почта \
  -v psy-caddy-data:/data \
  -v psy-caddy-config:/config \
  ghcr.io/itmagelab/psy.yainna.ru:latest
```

Или через compose:

```bash
podman-compose up -d
podman-compose logs -f site
```

### 2.3 Порты 80 и 443 под rootless podman

Внутри контейнера Caddy слушает непривилегированные 8080 и 8443 — так
контейнер запускается без изменения системы. На хосте эти порты
привилегированные, поэтому для rootless podman нужен один раз:

```bash
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
echo 'net.ipv4.ip_unprivileged_port_start=80' \
  | sudo tee /etc/sysctl.d/99-podman-ports.conf
```

Альтернатива без sysctl: повесить контейнер на хостовую сеть
(`--network=host`) и выставить `HTTP_PORT=80`, `HTTPS_PORT=8443`.

### 2.4 Сертификаты обязаны жить на volume

Каталог `/data` — место, где Caddy хранит сертификаты. Без volume
контейнер выпускал бы новый сертификат при каждом пересоздании и за
несколько дней упёрся бы в лимит Let's Encrypt (5 одинаковых сертификатов
в неделю).

## 3. Переменные окружения

| Переменная   | По умолчанию              | Назначение                             |
| ------------ | ------------------------- | -------------------------------------- |
| `DOMAIN`     | `psy.yainna.ru`           | Домен сайта                            |
| `HTTP_PORT`  | `8080`                    | HTTP и ACME-челлендж внутри контейнера |
| `HTTPS_PORT` | `8443`                    | HTTPS и TLS-ALPN внутри контейнера     |
| `ACME_EMAIL` | `webmaster@psy.yainna.ru` | Почта для уведомлений Let's Encrypt    |

**Не задавайте `ACME_EMAIL` пустой строкой.** Caddy подставляет значение по
умолчанию только для незаданной переменной, а пустая строка делает
конфигурацию невалидной и контейнер не стартует. В `compose.yaml` эта
переменная намеренно закомментирована.

## 4. Проверка

```bash
# Контейнер жив
podman healthcheck run psy

# Сайт отвечает
curl -I https://psy.yainna.ru/
curl -I https://psy.yainna.ru/privacy/

# 404 отдаёт свою страницу со статусом 404
curl -o /dev/null -s -w '%{http_code}\n' https://psy.yainna.ru/нет-такой-страницы

# Кеширование: HTML свежий, ассеты — навсегда
curl -sI https://psy.yainna.ru/ | grep -i cache-control
curl -sI https://psy.yainna.ru/_astro/Base.css | grep -i cache-control
```

Если сертификат не выпустился, смотрите лог:

```bash
podman logs psy | grep -iE "acme|certificate|error"
```

Частые причины: порт 80 закрыт файрволом, DNS смотрит не на этот сервер,
в `ACME_EMAIL` пустая строка.

## 5. Обновление сайта

```bash
podman pull ghcr.io/itmagelab/psy.yainna.ru:latest
podman rm -f psy
# повторите команду из раздела 2.2
```

Volume с сертификатами переживает пересоздание контейнера, поэтому
повторный выпуск сертификата не потребуется.

## 6. Публикация образа в GitHub Packages

Workflow `.github/workflows/container.yml` собирает образ при пуше в
`master` и при тегах `v*`, публикуя в `ghcr.io/itmagelab/psy.yainna.ru`:

| Тег           | Когда ставится           |
| ------------- | ------------------------ |
| `latest`      | каждый деплой в `master` |
| `sha-xxxxxxx` | короткий хеш коммита     |
| `v1.2.0`      | при пуше тега вида `v*`  |

Workflow собирает образы для `linux/amd64` и `linux/arm64` и соединяет их
в один манифест — подойдёт и для обычного VPS, и для ARM-сервера.

Собирать платформы вручную одной командой нельзя: `podman build --platform
linux/amd64,linux/arm64` создаёт в реестре запись только для текущей
платформы. Поэтому в CI платформы собираются по отдельности, а манифест
собирается через `podman manifest create` + `podman manifest push --all`.

Локальная публикация (нужен токен со scope `write:packages`):

```bash
gh auth refresh -h github.com -s write:packages
./scripts/container.sh push
```

## 7. Что где настраивается

| Задача                       | Файл                                                |
| ---------------------------- | --------------------------------------------------- |
| Изменить порты или домен     | `compose.yaml`, `deploy/caddy/Caddyfile`            |
| Изменить заголовки           | `deploy/caddy/Caddyfile` **и** `public/_headers`    |
| Изменить адрес canonical/OG  | `Containerfile` (аргументы `SITE_URL`, `BASE_PATH`) |
| Изменить образы Node и Caddy | `Containerfile` (первые строки)                     |

Заголовки безопасности намеренно продублированы в Caddyfile и в
`public/_headers`: первый нужен контейнеру, второй — GitHub Pages.
Правки вносите в оба файла.

## 8. Частые проблемы

**`bind: address already in use`** — порт на хосте занят. Проверьте
`ss -tlnp | grep -E ':(80|443)\b'`.

**Сертификат не выпускается, в логах ACME timeout** — не проброшен порт 80
на хосте. Let's Encrypt проверяет домен снаружи, поэтому 80 должен быть
открыт наружу, даже если сайт работает только по HTTPS.

**`parse caddyfile tokens for 'email'`** — в `ACME_EMAIL` пустая строка.
См. раздел 3.

**Сайт отдаётся, но стили не грузятся** — в образ попала сборка с
неверным `BASE_PATH`. Проверьте аргументы сборки: для домена `BASE_PATH=/`,
для публикации на подпути — `/имя-репозитория`.

**После обновления виден старый сайт** — Caddy не кеширует HTML, но
браузер мог сохранить страницу. Проверьте `Cache-Control` ответа.

## 9. Откат

```bash
podman pull ghcr.io/itmagelab/psy.yainna.ru:sha-<прошлый хеш>
podman rm -f psy
# запустить с новым тегом
```

Веб-сайт GitHub Pages при этом продолжит работать независимо: он
обслуживается из другого артефакта.
