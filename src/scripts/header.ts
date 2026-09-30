/** Шапка: состояние «прокручено» и мобильное меню. Работает без JS (меню скрыто). */

export function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
  const label = document.querySelector<HTMLElement>('[data-menu-label]');

  if (!header) return;

  /* --- Фон шапки после прокрутки --------------------------------------- */
  const onScroll = () => {
    header.toggleAttribute('data-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Мобильное меню --------------------------------------------------- */
  if (!toggle || !panel) return;

  const links = panel.querySelectorAll<HTMLAnchorElement>('[data-menu-link]');

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.toggleAttribute('data-open', open);
    panel.classList.toggle('invisible', !open);
    panel.classList.toggle('opacity-0', !open);
    if (label) label.textContent = open ? 'Закрыть' : 'Меню';
    document.body.style.overflow = open ? 'hidden' : '';
  };

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  links.forEach((link) => link.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  /* Закрываем, если вёрстка перестала быть мобильной (поворот экрана). */
  const wide = window.matchMedia('(min-width: 1024px)');
  wide.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
