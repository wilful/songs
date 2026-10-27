import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { generateOfflineAssets } from './offline/build-offline.mjs';

const BASE = '/songs';

// https://astro.build/config
export default defineConfig({
  base: BASE,
  trailingSlash: 'always',
  integrations: [
    {
      name: 'offline-songbook',
      hooks: {
        // Generates sw.js, manifest.webmanifest and the app icons into dist/,
        // so the built site works without network after the first visit.
        'astro:build:done': ({ dir, logger }) => {
          const result = generateOfflineAssets({ distDir: fileURLToPath(dir), base: BASE + '/' });
          logger.info(
            `offline cache "${result.cacheName}": ${result.fileCount} файлов в precache`
          );
        },
      },
    },
  ],
});
