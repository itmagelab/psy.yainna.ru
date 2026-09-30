/**
 * robots.txt собирается на этапе сборки, чтобы адрес карты сайта
 * совпадал с фактическим адресом публикации (домен или подпуть GitHub Pages).
 *
 * Счётчики и рекламные сети не используются — см. раздел 7 политики
 * конфиденциальности в src/content/legal/privacy.md.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const base = import.meta.env.BASE_URL;
  const sitemap = new URL('sitemap-index.xml', new URL(base, site ?? url.origin)).href;

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
