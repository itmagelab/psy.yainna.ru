import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { sectionSchema } from './schemas/sections';
import { legalSchema } from './schemas/legal';
import { siteSchema } from './schemas/site';
import { site } from './data/site';

/**
 * Content Collections — весь редактируемый контент сайта.
 *
 *   src/content/sections/*.md — десять блоков лендинга (порядок = поле order)
 *   src/content/legal/*.md    — юридические страницы
 *   src/data/site.ts          — глобальные данные (имя, контакты, цена, SEO)
 *
 * Схемы лежат в `src/schemas/`, чтобы ими пользовались и коллекции,
 * и проверка данных сайта.
 */

/**
 * Глобальные данные сайта проверяются здесь, а не в `src/data/site.ts`:
 * этот файл попадает и в клиентский код, и тащить туда Zod нельзя.
 * Ошибка в данных останавливает и dev-сервер, и сборку.
 */
siteSchema.parse(site);

const sections = defineCollection({
  loader: glob({ base: './src/content/sections', pattern: '**/*.md' }),
  schema: sectionSchema,
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.md' }),
  schema: legalSchema,
});

export const collections = { sections, legal };
