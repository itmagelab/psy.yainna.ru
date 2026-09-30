import { z } from 'astro/zod';

/**
 * Схема глобальных данных сайта.
 *
 * Хранится в `src/data/site.ts`. Здесь только форма — значения там.
 * Валидация выполняется на самом `site.ts` при импорте, поэтому ошибка
 * в данных останавливает сборку с понятным сообщением.
 */
const contact = z.string().min(1);

export const siteSchema = z.object({
  /** Короткое имя для шапки и футера. TODO: заменить на реальное. */
  shortName: z.string().min(1),
  /** Полное имя — для JSON-LD и юридических документов. TODO: заменить. */
  fullName: z.string().min(1),
  /** Профессиональное позиционирование одной строкой. */
  role: z.string().min(1),
  /** Подпись под именем в подвале и в шапке. */
  tagline: z.string().min(1),

  city: z.string().min(1),
  address: z.string().min(1),
  onlineNote: z.string().min(1),

  contacts: z.object({
    telegram: contact,
    whatsapp: contact,
    max: contact,
    email: contact,
    phone: z.string().optional(),
  }),

  socials: z.object({
    instagram: z.url(),
    telegram: z.url(),
    vk: z.url(),
  }),

  /** Реквизиты для политики конфиденциальности. TODO: заполнить. */
  requisites: z.object({
    fullName: z.string().min(1),
    inn: z.string().min(1),
    ogrnip: z.string().min(1).optional(),
    address: z.string().min(1),
    email: z.string().min(1),
  }),

  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogImage: z.string().min(1),
  }),

  locale: z.string().default('ru_RU'),
});

export type Site = z.infer<typeof siteSchema>;
