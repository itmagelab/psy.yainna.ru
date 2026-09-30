import { z } from 'astro/zod';

/**
 * Схема секций лендинга.
 *
 * Каждая секция — отдельный `.md` в `src/content/sections/`.
 * Поле `kind` однозначно определяет форму файла: если забыть обязательное
 * поле или указать несуществующий `kind`, сборка упадёт с именем файла.
 *
 * Порядок секций на странице задаёт числовое поле `order`.
 * Тело markdown-файла используется там, где нужен живой текст («Обо мне»).
 */

const cta = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  note: z.string().optional(),
});

/**
 * Фотография. `src` — имя файла внутри `src/assets/photos/`.
 * Если файла нет, компонент Photo рисует фирменную заглушку,
 * поэтому поле можно оставить пустым, пока нет фотосессии.
 */
const photo = z.object({
  src: z.string().optional(),
  alt: z.string().min(1),
  width: z.number().default(1200),
  height: z.number().default(1500),
  /** object-position: кадрирование внимания, например «50% 30%». */
  position: z.string().default('50% 35%'),
});

const socialNetwork = z.enum(['instagram', 'telegram', 'vk']);
const messenger = z.enum(['telegram', 'whatsapp', 'max', 'email']);

/** Поля, общие для всех секций. */
const base = {
  order: z.number().default(1),
  anchor: z.string().min(1),
  /** Подпись в навигации шапки. Не задана — секция в меню не попадает. */
  nav: z.string().optional(),
};

const heroSchema = z.object({
  kind: z.literal('hero'),
  ...base,
  order: z.number().default(1),
  anchor: z.string().default('hero'),
  nav: z.string().optional(),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  /** Вторая строка заголовка — терракотовым цветом, с «рукописным» подчёркиванием. */
  titleAccent: z.string().optional(),
  subtitle: z.string().min(1),
  primaryCta: cta,
  secondaryCta: cta.optional(),
  facts: z.array(z.string()).default([]),
  photo,
});

const requestsSchema = z.object({
  kind: z.literal('requests'),
  order: z.number().default(2),
  anchor: z.string().default('requests'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  items: z
    .array(
      z.object({
        /** Формулировка от первого лица — чтобы человек узнал себя. */
        phrase: z.string().min(1),
        tag: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .min(3),
});

const aboutSchema = z.object({
  kind: z.literal('about'),
  order: z.number().default(3),
  anchor: z.string().default('about'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  photo,
  quote: z
    .object({
      text: z.string().min(1),
      source: z.string().optional(),
    })
    .optional(),
  values: z
    .array(
      z.object({
        title: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .default([]),
  /** Короткие факты под фотографией: «12 лет практики», «500+ часов обучения». */
  facts: z.array(z.string()).default([]),
});

const educationSchema = z.object({
  kind: z.literal('education'),
  order: z.number().default(4),
  anchor: z.string().default('education'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  items: z
    .array(
      z.object({
        year: z.string().optional(),
        title: z.string().min(1),
        place: z.string().optional(),
        note: z.string().optional(),
        /** Скан сертификата — открывается в просмотрщике. */
        certificate: z
          .object({
            src: z.string().min(1),
            alt: z.string().min(1),
            width: z.number().default(1000),
            height: z.number().default(1400),
          })
          .optional(),
      }),
    )
    .min(1),
  note: z.string().optional(),
});

const processSchema = z.object({
  kind: z.literal('process'),
  order: z.number().default(5),
  anchor: z.string().default('process'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .min(2),
  /** Акценты цифрами: 50 минут, 1 раз в неделю, онлайн и очно. */
  highlights: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .default([]),
  note: z.string().optional(),
});

const pricingSchema = z.object({
  kind: z.literal('pricing'),
  order: z.number().default(6),
  anchor: z.string().default('pricing'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  offers: z
    .array(
      z.object({
        name: z.string().min(1),
        format: z.string().optional(),
        duration: z.string().min(1),
        frequency: z.string().min(1),
        /** Число, а не строка: формат выводится через Intl, чтобы цена
         *  не расходилась между секцией «Стоимость», подвалом и JSON-LD. */
        price: z.number().int().positive(),
        priceNote: z.string().optional(),
        address: z.string().optional(),
      }),
    )
    .min(1),
  includes: z.array(z.string()).default([]),
  note: z.string().optional(),
});

const faqSchema = z.object({
  kind: z.literal('faq'),
  order: z.number().default(7),
  anchor: z.string().default('faq'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  items: z
    .array(
      z.object({
        q: z.string().min(1),
        a: z.string().min(1),
      }),
    )
    .min(3),
});

const socialSchema = z.object({
  kind: z.literal('social'),
  order: z.number().default(8),
  anchor: z.string().default('social'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  links: z
    .array(
      z.object({
        network: socialNetwork,
        url: z.url(),
        handle: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
});

const contactSchema = z.object({
  kind: z.literal('contact'),
  order: z.number().default(9),
  anchor: z.string().default('contact'),
  nav: z.string().optional(),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  /** Что человек увидит после отправки. */
  promise: z.string().min(1),
  methods: z
    .array(
      z.object({
        network: messenger,
        label: z.string().min(1),
        note: z.string().optional(),
      }),
    )
    .min(2),
  /** Шаблон сообщения для предзаполнения. {name} {contact} {message}. */
  messageTemplate: z.string().min(1),
  consent: z.object({
    text: z.string().min(1),
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          href: z.string().min(1),
        }),
      )
      .min(1),
  }),
  fallbackNote: z.string().optional(),
});

const footerSchema = z.object({
  kind: z.literal('footer'),
  order: z.number().default(10),
  anchor: z.string().default('footer'),
  nav: z.string().optional(),
  note: z.string().optional(),
  legal: z
    .array(
      z.object({
        label: z.string().min(1),
        href: z.string().min(1),
      }),
    )
    .default([]),
});

export const sectionSchema = z.discriminatedUnion('kind', [
  heroSchema,
  requestsSchema,
  aboutSchema,
  educationSchema,
  processSchema,
  pricingSchema,
  faqSchema,
  socialSchema,
  contactSchema,
  footerSchema,
]);

export type SectionKind = z.infer<typeof sectionSchema>['kind'];
export type Section = z.infer<typeof sectionSchema>;
export type PhotoData = z.infer<typeof photo>;
