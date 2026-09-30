import { messengerLinks, buildMessage, type Messenger } from '../lib/links';

/** Название мессенджера для текста статуса. */
const names: Record<Messenger, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  max: 'MAX',
  email: 'почте',
};

/**
 * Форма записи.
 *
 * Сервера нет: собираем текст и открываем выбранный мессенджер.
 * Прямые ссылки на мессенджеры работают и без этого скрипта.
 */
export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector<HTMLElement>('[data-status]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  const inputs = form.querySelectorAll<HTMLInputElement>('[data-method-input]');

  const labels: Record<string, string> = {
    telegram: 'Написать в Telegram',
    whatsapp: 'Написать в WhatsApp',
    max: 'Написать в MAX',
    email: 'Написать на почту',
  };

  const currentMethod = (): Messenger => {
    const checked = form.querySelector<HTMLInputElement>('[data-method-input]:checked');
    return (checked?.value ?? 'telegram') as Messenger;
  };

  const syncLabel = () => {
    const method = currentMethod();
    if (submitLabel) submitLabel.textContent = labels[method] ?? 'Отправить';
  };

  inputs.forEach((input) => input.addEventListener('change', syncLabel));
  syncLabel();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get('name') ?? '');
    const contact = String(data.get('contact') ?? '');
    const message = String(data.get('message') ?? '');

    if (!name.trim() || !contact.trim()) {
      setStatus('Напишите, пожалуйста, имя и способ связи — так проще ответить.', true);
      return;
    }

    if (!form.querySelector<HTMLInputElement>('[name="consent"]')?.checked) {
      setStatus(
        'Нужно согласие на обработку персональных данных — без него заявку принять нельзя.',
        true,
      );
      return;
    }

    const method = currentMethod();
    const template =
      form.dataset.messageTemplate ??
      'Здравствуйте! Меня зовут {name}. Удобный способ связи: {contact}. {message}';

    const text = buildMessage(template, { name, contact, message });
    const url = messengerLinks[method](text);

    const opened = window.open(url, '_blank', 'noopener');
    setStatus(
      opened || typeof opened === 'undefined'
        ? `Открываю ${names[method]}. Если окно не появилось — напишите по прямой ссылке рядом с формой.`
        : `Браузер заблокировал новое окно. Откройте ссылку на ${names[method]} рядом с формой.`,
      !opened,
    );

    if (opened) form.reset();
  });

  function setStatus(text: string, isError = false) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('text-clay-700', isError);
  }
}
