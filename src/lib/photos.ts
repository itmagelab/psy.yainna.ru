import type { ImageMetadata } from 'astro';

/**
 * Реестр фотографий.
 *
 * Файлы кладутся в `src/assets/photos/`, а в контенте указывается только имя
 * (`portrait-main.jpg`). Если файла нет — компонент Photo покажет фирменную
 * заглушку, поэтому вёрстка не ломается и до фотосессии.
 *
 * Важно: карта собирается на этапе сборки, имена хэшируются и минифицируются.
 */
const photos = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/**/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

export function getPhoto(src?: string): ImageMetadata | undefined {
  if (!src) return undefined;
  const key = `/src/assets/photos/${src.replace(/^\.?\//, '')}`;
  return photos[key]?.default;
}

/** Список имён всех доступных фотографий — удобно при подстановке снимков. */
export const photoNames = Object.keys(photos).map((key) => key.replace('/src/assets/photos/', ''));

/** Сборка пропсов для <Picture> без повторения в компонентах. */
export function pictureProps(photo: {
  width: number;
  height: number;
  position?: string;
  sizes?: string;
}) {
  return {
    widths: [360, 540, 720, 960, 1200, 1600].filter((w) => w <= photo.width),
    sizes: photo.sizes ?? '(min-width: 1024px) 44vw, 92vw',
    formats: ['avif', 'webp'],
    quality: 78,
    style: `object-position: ${photo.position ?? '50% 35%'}`,
  };
}
