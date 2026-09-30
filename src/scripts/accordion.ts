/**
 * Аккордеон FAQ.
 *
 * Разметка собрана по образцу WAI-ARIA APG: кнопка с aria-expanded и
 * aria-controls, панель с role="region". Раскрытие анимируется через
 * grid-template-rows: 0fr → 1fr (не требует измерения высоты).
 *
 * В разметке панели открыты (aria-expanded="true" только у первого),
 * скрипт закрывает остальные — без JS виден весь текст.
 */
export function initAccordion() {
  const roots = document.querySelectorAll<HTMLElement>('[data-accordion]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  roots.forEach((root) => {
    const items = root.querySelectorAll<HTMLElement>('[data-accordion-item]');
    const oneOpen = root.dataset.accordionOneOpen !== 'false';

    items.forEach((item) => {
      const button = item.querySelector<HTMLButtonElement>('[data-accordion-button]');
      const panel = item.querySelector<HTMLElement>('[data-accordion-panel]');
      if (!button || !panel) return;

      /* Приводим начальное состояние к разметке: открыт только первый. */
      const initial = item.hasAttribute('data-open');
      setState(item, button, panel, initial, reduce.matches);

      button.addEventListener('click', () => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        if (!isOpen && oneOpen) {
          items.forEach((other) => {
            if (other === item) return;
            const otherButton = other.querySelector<HTMLButtonElement>('[data-accordion-button]');
            const otherPanel = other.querySelector<HTMLElement>('[data-accordion-panel]');
            if (otherButton && otherPanel) {
              setState(other, otherButton, otherPanel, false, reduce.matches);
            }
          });
        }

        setState(item, button, panel, !isOpen, reduce.matches);
      });
    });
  });
}

function setState(
  item: HTMLElement,
  button: HTMLButtonElement,
  panel: HTMLElement,
  open: boolean,
  instant: boolean,
) {
  button.setAttribute('aria-expanded', String(open));
  item.toggleAttribute('data-open', open);

  const label = item.querySelector<HTMLElement>('[data-accordion-label]');
  const plus = item.querySelector<HTMLElement>('[data-accordion-plus]');

  if (open) {
    panel.style.gridTemplateRows = '1fr';
    label?.style.removeProperty('font-style');
  } else {
    panel.style.gridTemplateRows = '0fr';
  }

  /* При отключённой анимации панель скрывается сразу. */
  if (instant) {
    panel.style.transition = 'none';
    panel.style.gridTemplateRows = open ? '1fr' : '0fr';
    panel.setAttribute('aria-hidden', String(!open));
    requestAnimationFrame(() => {
      panel.style.removeProperty('transition');
    });
  } else {
    panel.setAttribute('aria-hidden', String(!open));
  }

  if (plus) plus.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
}
