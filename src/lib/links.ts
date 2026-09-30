import { site } from '../data/site';

/**
 * Ссылки для связи.
 *
 * Серверной отправки форм нет: заявка уходит в выбранный пользователем
 * мессенджер с предзаполненным текстом. Поэтому здесь только сборка ссылок.
 *
 * Формат контактов — в `src/data/site.ts`:
 *   telegram — username без @, для ссылки https://t.me/<username>
 *   whatsapp — только цифры, без + и пробелов
 *   max      — ссылка на профиль в мессенджере MAX
 */

const encode = (text: string) => encodeURIComponent(text.trim());

export const messengerLinks = {
  telegram: (text?: string) =>
    `https://t.me/${site.contacts.telegram}${text ? `?text=${encode(text)}` : ''}`,
  whatsapp: (text?: string) =>
    `https://wa.me/${site.contacts.whatsapp}${text ? `?text=${encode(text)}` : ''}`,
  max: (text?: string) => {
    // TODO: уточнить формат deep link у мессенджера MAX с предзаполненным
    // текстом. Пока используем ссылку на профиль из src/data/site.ts.
    void text;
    return site.contacts.max;
  },
  email: (text?: string) =>
    `mailto:${site.contacts.email}${text ? `?subject=${encode('Запись на консультацию')}&body=${encode(text)}` : ''}`,
} as const;

export type Messenger = keyof typeof messengerLinks;

/** Подставляет поля формы в шаблон сообщения. */
export function buildMessage(
  template: string,
  values: { name?: string; contact?: string; message?: string },
): string {
  return template
    .replace('{name}', values.name?.trim() || '—')
    .replace('{contact}', values.contact?.trim() || '—')
    .replace('{message}', values.message?.trim() || '')
    .replace(/\s*\n\s*\n\s*/g, '\n\n')
    .trim();
}
