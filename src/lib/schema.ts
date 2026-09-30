import { site } from '../data/site';

/**
 * Разметка Schema.org для главной страницы.
 *
 * Одна общая @graph: Person + MedicalBusiness (психолог) + WebSite + FAQPage.
 * Схема собирается из контента, поэтому не разъезжается с текстами и не
 * требует ручного дублирования.
 *
 * Адрес сайта передаётся снаружи: модуль обычный, глобальный `Astro` в нём
 * недоступен (и не должен быть — логику проще тестировать).
 */
export interface GraphInput {
  /** Абсолютный адрес сайта, например https://psy.yainna.ru/ */
  siteUrl: string;
  /** Цена первой сессии — попадает в priceRange. */
  price?: number;
  /** Базовый путь публикации: '/' или '/psy.yainna.ru/'. */
  baseUrl?: string;
  /** Вопросы и ответы из секции kind: faq. */
  faq?: { q: string; a: string }[];
}

const trim = (url: string) => url.replace(/\/+$/, '');

export function buildGraph({ siteUrl, baseUrl = '/', price, faq = [] }: GraphInput) {
  const origin = trim(siteUrl);
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const image = new URL(site.seo.ogImage.replace(/^\//, ''), new URL(base, `${origin}/`)).href;

  const nodes: object[] = [
    {
      '@type': 'Person',
      '@id': `${origin}/#person`,
      name: site.fullName,
      jobTitle: site.role,
      description: site.seo.description,
      url: `${origin}/`,
      image,
      sameAs: [site.socials.instagram, site.socials.telegram, site.socials.vk],
      knowsAbout: [
        'Гештальт-подход',
        'Психотерапия отношений',
        'Работа с тревогой',
        'Отношения с собой и с другими',
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.city,
        streetAddress: site.address,
        addressCountry: 'RU',
      },
    },
    {
      '@type': 'MedicalBusiness',
      '@id': `${origin}/#practice`,
      name: site.role,
      description: site.seo.description,
      url: `${origin}/`,
      image,
      priceRange: price ? `${price} RUB` : undefined,
      availableLanguage: ['Russian'],
      medicalSpecialty: 'Psychiatric',
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.city,
        streetAddress: site.address,
        addressCountry: 'RU',
      },
      areaServed: { '@type': 'Country', name: 'Россия' },
      founder: { '@id': `${origin}/#person` },
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: `${origin}/`,
      name: site.seo.title,
      inLanguage: site.locale,
      publisher: { '@id': `${origin}/#person` },
    },
  ];

  if (faq.length > 0) {
    nodes.push({
      '@type': 'FAQPage',
      '@id': `${origin}/#faq`,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
