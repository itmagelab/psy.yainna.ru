/**
 * Генерация OG-картинки (1200×630) из SVG при сборке.
 *
 * Запуск: node scripts/og.mjs (автоматически после `astro build`).
 * Результат: public/og.png и public/apple-touch-icon.png.
 *
 * Картинка собирается из тех же токенов, что и сайт, поэтому не расходится
 * с брендом. Шрифты не подключаем — SVG рендерится системным serif,
 * кириллица вписывается в ту же сетку.
 */
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Читает значения токенов из src/styles/tokens.css, чтобы не дублировать цвета. */
async function readTokens() {
  const css = await readFile(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const block = css.slice(css.indexOf('@theme'), css.indexOf('}'));
  const value = (name) => {
    const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
    if (!match) throw new Error(`Токен ${name} не найден в tokens.css`);
    return match[1].trim();
  };
  return {
    cream100: value('--color-cream-100'),
    cream50: value('--color-cream-50'),
    mist200: value('--color-mist-200'),
    mist300: value('--color-mist-300'),
    clay200: value('--color-clay-200'),
    clay700: value('--color-clay-700'),
    ink900: value('--color-ink-900'),
    ink500: value('--color-ink-500'),
  };
}

/** Читает имя и роль из данных сайта, чтобы текст на картинке был актуальным. */
async function readSite() {
  const source = await readFile(path.join(root, 'src/data/site.ts'), 'utf8');
  const field = (name) => {
    const match = source.match(new RegExp(`${name}:\\s*'([^']+)'`));
    if (!match) throw new Error(`Поле ${name} не найдено в src/data/site.ts`);
    return match[1];
  };
  return { fullName: field('fullName'), role: field('role'), tagline: field('tagline') };
}

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * OKLCH → #rrggbb.
 *
 * Резолвер sharp использует librsvg, который не понимает oklch(),
 * поэтому цвет из токенов приводится к sRGB вручную (CSS Color 4).
 */
function oklchToHex(source) {
  const match = source.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i,
  );
  if (!match) return source;

  const [, lRaw, cRaw, hRaw] = match;
  const L = lRaw.endsWith('%') ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
  const C = parseFloat(cRaw);
  const H = (parseFloat(hRaw) * Math.PI) / 180;

  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  const channel = (value) => {
    const v = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };

  return `#${linear
    .map(channel)
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

const t = Object.fromEntries(
  Object.entries(await readTokens()).map(([key, value]) => [key, oklchToHex(value)]),
);
const site = await readSite();

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.cream100}"/>
      <stop offset="100%" stop-color="${t.mist200}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Мотив «фигура и фон» -->
  <circle cx="1015" cy="128" r="228" fill="${t.mist300}" fill-opacity="0.55"/>
  <circle cx="915" cy="498" r="196" fill="${t.clay200}" fill-opacity="0.75"/>
  <circle cx="963" cy="292" r="80" fill="${t.cream50}" fill-opacity="0.55"/>
  <circle cx="963" cy="292" r="80" fill="none" stroke="${t.ink900}" stroke-opacity="0.22" stroke-width="2"/>
  <circle cx="1015" cy="128" r="228" fill="none" stroke="${t.ink900}" stroke-opacity="0.15" stroke-width="2"/>

  <g transform="translate(96 168)">
    <line x1="0" y1="0" x2="46" y2="0" stroke="${t.clay700}" stroke-opacity="0.6" stroke-width="2"/>
    <text x="66" y="7" font-family="Georgia, 'Times New Roman', serif" font-size="25" letter-spacing="3" fill="${t.clay700}">
      ${escape(site.tagline.toUpperCase())}
    </text>

    <text x="0" y="122" font-family="Georgia, 'Times New Roman', serif" font-size="82" fill="${t.ink900}">
      ${escape(site.fullName)}
    </text>

    <text x="0" y="196" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="${t.clay700}">
      ${escape(site.role)}
    </text>

    <path d="M2 216C210 206 470 202 700 206" fill="none" stroke="${t.clay700}" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>

    <text x="0" y="268" font-family="Georgia, 'Times New Roman', serif" font-size="28" fill="${t.ink500}">
      ${escape('Сессия 50 минут · раз в неделю · онлайн и очно в Сочи')}
    </text>
  </g>
</svg>`;

await mkdir(path.join(root, 'public'), { recursive: true });

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(root, 'public/og.png'));
console.log('og: public/og.png (1200×630)');

/* Иконка для iOS: та же композиция, квадратная. */
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${t.cream100}"/>
  <circle cx="41" cy="23" r="19" fill="${t.mist300}"/>
  <circle cx="26" cy="40" r="15" fill="${t.clay200}"/>
  <circle cx="41" cy="23" r="19" fill="none" stroke="${t.ink900}" stroke-opacity="0.28"/>
  <circle cx="34" cy="32" r="6.5" fill="${t.cream50}" fill-opacity="0.65"/>
</svg>`;

await sharp(Buffer.from(icon)).png().toFile(path.join(root, 'public/apple-touch-icon.png'));
console.log('og: public/apple-touch-icon.png (180×180)');
