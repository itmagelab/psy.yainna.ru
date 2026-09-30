// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Адрес публикации задаётся переменными окружения, чтобы переключение
 * между собственным доменом и адресом GitHub Pages не требовало правок кода.
 *
 *   SITE_URL=https://psy.yainna.ru  BASE_PATH=/            — собственный домен
 *   SITE_URL=https://itmagelab.github.io  BASE_PATH=/psy.yainna.ru — Pages
 */
const SITE_URL = process.env.SITE_URL ?? 'https://psy.yainna.ru';
const BASE_PATH = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  // GitHub Pages отдаёт каталоги как /path/, поэтому без этого будут 301-редиректы.
  trailingSlash: 'always',
  // В Astro 7 по умолчанию схлопывание пробелов по правилам JSX,
  // из-за которого могут пропасть пробелы между инлайновыми элементами.
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
