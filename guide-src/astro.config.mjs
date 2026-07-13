import { defineConfig } from 'astro/config';

// Astro is a build-time tool only. Output is committed and served statically
// by Vercel with no build step. base:'/guide' makes all internal asset URLs
// resolve under /guide/*. outDir writes the built site into the repo-root
// guide/ folder (one level up from guide-src/).
export default defineConfig({
  site: 'https://thatsright.xyz',
  base: '/guide',
  outDir: '../guide',
  trailingSlash: 'never',
  build: { format: 'file' }, // emit /guide/faq.html not /guide/faq/index.html
});
