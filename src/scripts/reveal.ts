/**
 * Появление блоков при прокрутке.
 *
 * Без JS элементы видны (класс .reveal снимается правилом html.no-js).
 * Скрипт добавляет is-visible и больше ничего не меняет: пользователь
 * с отключённой анимацией ничего не теряет.
 */
export function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (!items.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  items.forEach((el) => observer.observe(el));
}
