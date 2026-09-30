# psy.yainna.ru

Лендинг психотерапевта в гештальт-подходе. Статический сайт на Astro,
публикуется в GitHub Pages.

Полное техническое задание — [`doc/ABOUT.md`](doc/ABOUT.md).
Правила работы с репозиторием для ИИ-агентов — [`AGENTS.md`](AGENTS.md).

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:4321
```

Требуется Node.js ≥ 22.12 (в проекте зафиксирована версия 24 в `.node-version`).

## Команды

| Команда           | Что делает                                            |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Дев-сервер с горячей перезагрузкой                    |
| `npm run build`   | Сборка в `dist/` + OG-картинка + предзагрузка шрифтов |
| `npm run preview` | Просмотр собранного сайта локально                    |
| `npm run check`   | Типы `.astro` и `.ts` (`astro check`)                 |
| `npm run lint`    | ESLint                                                |
| `npm run format`  | Prettier                                              |
| `npm run verify`  | Всё вышеперечисленное одной командой                  |

## Как поменять текст

Тексты лежат в markdown-файлах с YAML-разметкой — править можно прямо
на GitHub, без установки чего-либо:

```
src/content/sections/hero.md       первый экран
src/content/sections/requests.md   «С чем можно прийти»
src/content/sections/about.md      «Обо мне»
src/content/sections/education.md  образование и опыт
src/content/sections/process.md    как проходит работа
src/content/sections/pricing.md    формат и стоимость
src/content/sections/faq.md        вопросы и ответы
src/content/sections/social.md     соцсети
src/content/sections/contact.md    запись
src/content/sections/footer.md     подпись и юридические ссылки
src/content/legal/*.md             политика и согласие на обработку ПДн
src/data/site.ts                   имя, контакты, реквизиты, SEO
```

Если забыть обязательное поле, сборка упадёт с указанием файла и поля —
это защита от «тихо сломанного» сайта.

## Как добавить фотографии

Положите файл в `src/assets/photos/` и укажите его имя в контенте:

```yaml
photo:
  src: portrait-main.jpg
  alt: Портрет Анны Волковой
  width: 1200
  height: 1500
  position: 50% 30%
```

Пока файла нет, на сайте показывается фирменная заглушка в той же пропорции.
Требования к снимкам — в `src/assets/photos/README.md`.

## Публикация

Пуш в `master` запускает `.github/workflows/deploy.yml`: сборка → GitHub Pages.
Полный запуск и проверка — в `.github/workflows/ci.yml`.

Адрес сайта задаётся переменными репозитория (Settings → Secrets and variables
→ Actions → Variables): `SITE_URL`, `BASE_PATH`, `CUSTOM_DOMAIN`. Подробности —
в `AGENTS.md`, раздел «Деплой».

## Документы

- [`AGENTS.md`](AGENTS.md) — как работать с проектом: стек, структура, правила, чек-листы.
- [`doc/DESIGN.md`](doc/DESIGN.md) — визуальная система: палитра, шрифты, сетка, компоненты.
- [`doc/CONTENT.md`](doc/CONTENT.md) — как писать тексты и что заменить перед запуском.
- [`doc/ABOUT.md`](doc/ABOUT.md) — исходное техническое задание.
