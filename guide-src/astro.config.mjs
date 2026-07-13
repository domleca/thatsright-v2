import { defineConfig } from 'astro/config';

// Astro is a BUILD-TIME tool only; its output is committed and served statically
// by Vercel with no build step. NO `base` is set — page URLs come from the
// src/pages/guide/** and src/pages/fr/guide/** file layout, which is what lets
// one build emit BOTH /guide/* and /fr/guide/*. Default outDir is guide-src/dist/,
// which `astro build` may safely wipe. scripts/place.mjs copies the two language
// trees out to the repo root. Never point outDir at the repo root: the build
// cleans it and would delete the existing site.
export default defineConfig({
  site: 'https://thatsright.xyz',
  trailingSlash: 'never',
});
