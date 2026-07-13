// Copy the built language trees from dist/ to their repo-root homes.
// Run automatically after `astro build` (see package.json build script).
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));            // guide-src/
const pairs = [
  ['dist/guide',    '../guide'],
  ['dist/fr/guide', '../fr/guide'],
  ['dist/_astro',   '../_astro'],
];
for (const [from, to] of pairs) {
  await rm(new URL(to + '/', `file://${root}`), { recursive: true, force: true });
  await cp(new URL(from, `file://${root}`), new URL(to, `file://${root}`), { recursive: true });
}
console.log('placed guide/, fr/guide/, and _astro/ from dist/');
