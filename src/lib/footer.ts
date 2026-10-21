import { getCollection } from 'astro:content';

/**
 * Данные подвала — секция `kind: footer` из `src/content/sections/`.
 *
 * Подвал собирается на всех страницах: на лендинге, на юридических
 * страницах и на 404. Источник один — этот помощник, поэтому плашка
 * и тексты подвала не расползаются копиями по разметке.
 */
export async function getFooterSection() {
  const entries = await getCollection('sections');
  const entry = entries.find((item) => item.data.kind === 'footer');
  return entry?.data.kind === 'footer' ? entry.data : undefined;
}

/** Плашка внизу страницы: короткая строка и необязательная ссылка. */
export interface FooterCredit {
  text: string;
  href?: string;
}
