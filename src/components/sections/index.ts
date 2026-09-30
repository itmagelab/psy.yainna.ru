import Hero from './Hero.astro';
import Requests from './Requests.astro';
import About from './About.astro';
import Education from './Education.astro';
import Process from './Process.astro';
import Pricing from './Pricing.astro';
import Faq from './Faq.astro';
import Social from './Social.astro';
import Contact from './Contact.astro';

/**
 * Реестр секций: kind из frontmatter → компонент.
 *
 * Явная карта вместо динамического импорта: опечатка в `kind` приводит
 * к понятной ошибке сборки, а не к молчаливо пропавшему блоку.
 *
 * kind: footer сюда не входит — его данные уходят в Footer макета.
 */
export const sectionComponents = {
  hero: Hero,
  requests: Requests,
  about: About,
  education: Education,
  process: Process,
  pricing: Pricing,
  faq: Faq,
  social: Social,
  contact: Contact,
} as const;

export type SectionComponent = keyof typeof sectionComponents;
