import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ESLint (flat config, ESLint 10).
 *
 * Проверяем TypeScript, разметку Astro и доступность на уровне шаблонов
 * (правила jsx-a11y через eslint-plugin-astro).
 */
export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', '.astro/**', 'public/**', '**/*.md']),

  js.configs.recommended,
  tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  /* Схемы и данные — обычный TypeScript без браузерных глобалов. */
  {
    files: ['src/content.config.ts', 'src/schemas/**/*.ts', 'src/data/**/*.ts'],
    rules: { 'no-console': 'off' },
  },

  /* Скрипты сборки — CLI, их вывод в консоль и есть результат работы. */
  {
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
]);
