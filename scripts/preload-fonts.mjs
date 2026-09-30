/**
 * Предзагрузка шрифтов.
 *
 * Astro собирает @fontsource в один CSS с путями вида
 * `/_astro/onest-cyrillic-wght-normal.<hash>.woff2`. Чтобы первый заголовок
 * не «прыгал» при загрузке, кириллическое подмножество (его использует весь
 * сайт) подключается через <link rel="preload">.
 *
 * Запуск: node scripts/preload-fonts.mjs (автоматически после `astro build`).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

/** Находим ссылки на кириллические подмножества в собранном CSS. */
async function findCyrillicFonts() {
  const assets = await readdir(path.join(dist, '_astro'));
  const cssFiles = assets.filter((file) => file.endsWith('.css'));

  const urls = new Set();
  for (const cssFile of cssFiles) {
    const css = await readFile(path.join(dist, '_astro', cssFile), 'utf8');

    // Минификатор убирает комментарии и ведущие нули в unicode-range
    // (U+0400-045F → U+460-52F), поэтому ориентируемся на имя файла:
    // кириллица — это ...-cyrillic-wght-..., но не ...-cyrillic-ext-...
    for (const match of css.matchAll(/url\(\/?_astro\/([^)'"]*cyrillic[^)'"]*\.woff2)\)/g)) {
      const file = match[1];
      if (file.includes('cyrillic-ext')) continue;
      urls.add(`/_astro/${file}`);
    }
  }

  return [...urls];
}

const fonts = await findCyrillicFonts();

if (fonts.length === 0) {
  console.log('preload: кириллические шрифты не найдены, пропускаем');
  process.exit(0);
}

const links = fonts
  .map((font) => `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`)
  .join('\n    ');

const pages = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) pages.push(full);
  }
}
await walk(dist);

for (const page of pages) {
  let html = await readFile(page, 'utf8');
  if (html.includes('rel="preload" href="/_astro/')) continue;

  html = html.replace('</title>', `</title>\n    ${links}`);
  await writeFile(page, html);
}

console.log(`preload: ${fonts.length} шрифт(а) в ${pages.length} страниц(ах)`);
for (const font of fonts) console.log(`  ${font}`);
