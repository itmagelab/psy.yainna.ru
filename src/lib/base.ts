/**
 * Пути внутри сайта.
 *
 * Внутренние ссылки нельзя писать как `href="/"` или `href="/privacy/"`:
 * при публикации на подпути (GitHub Pages отдаёт проект по /psy.yainna.ru)
 * такие адреса уводят в корень домена. BASE_URL Astro уже содержит нужный
 * префикс и завершающий слеш.
 */
export const BASE = import.meta.env.BASE_URL;

/** Адрес главной страницы: '/' или '/psy.yainna.ru/'. */
export const homeHref = BASE;

/** Собирает внутренний адрес: withBase('privacy/') → '/psy.yainna.ru/privacy/'. */
export function withBase(path: string): string {
  return `${BASE}${path.replace(/^\//, '')}`;
}

/** Секция главной страницы: withSection('contact') → '/psy.yainna.ru/#contact'. */
export function withSection(anchor: string): string {
  return withBase(`#${anchor.replace(/^#/, '')}`);
}

/**
 * Приводит ссылку из контента к рабочему виду.
 *
 * В контенте ссылки пишутся читаемо: `/privacy/`, `/` или `https://…`.
 * Здесь они превращаются в адрес с учётом базового пути.
 */
export function internalHref(href: string): string {
  if (!href.startsWith('/')) return href;
  return withBase(href);
}
