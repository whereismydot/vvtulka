import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  base: './',
  build: {
    // Сайт публикуется по адресу /vvtulka/; корень домена перебрасывает сюда (scripts/prepare-pages-dist.mjs)
    outDir: 'dist/vvtulka',
    emptyOutDir: true
  },
  define: {
    __APP_VERSION__: JSON.stringify(version)
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts']
    }
  }
});
