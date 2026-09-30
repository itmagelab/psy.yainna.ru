/**
 * Просмотрщик изображений на нативном <dialog>.
 *
 * Кнопки помечены data-lightbox-open с атрибутами-данными изображения.
 * В разметке остаётся обычный <button>, поэтому без JS ничего не ломается:
 * доступна ссылка на документ обычным текстом рядом.
 */
export function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  if (!dialog) return;

  const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]');
  if (!image) return;

  const openers = document.querySelectorAll<HTMLElement>('[data-lightbox-open]');

  const open = (opener: HTMLElement) => {
    const src = opener.dataset.lightboxSrc;
    if (!src) return;

    image.src = src;
    image.alt = opener.dataset.lightboxAlt ?? '';
    image.width = Number(opener.dataset.lightboxWidth ?? 1200);
    image.height = Number(opener.dataset.lightboxHeight ?? 1600);
    if (caption) caption.textContent = opener.dataset.lightboxAlt ?? '';

    dialog.showModal();
  };

  openers.forEach((opener) => {
    opener.addEventListener('click', () => open(opener));
  });

  /* Клик по затемнённому фону закрывает просмотрщик. */
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
