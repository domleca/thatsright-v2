// validate.mjs — run before astro build to catch referential integrity errors
// that Astro's content layer does not enforce at build time.
// Checks: every snag.faqRef in steps points at an existing FAQ id.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)); // guide-src/

function readJsonDir(rel) {
  const dir = new URL(rel, `file://${root}/`);
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
}

const faqs = readJsonDir('src/content/faqs/');
const steps = readJsonDir('src/content/steps/');

const faqIds = new Set(faqs.map(f => f.id));

let errors = 0;
for (const step of steps) {
  if (step.snag?.faqRef && !faqIds.has(step.snag.faqRef)) {
    console.error(
      `[validate] step "${step.slug}" has snag.faqRef "${step.snag.faqRef}" which does not match any FAQ id.`
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(`[validate] ${errors} referential integrity error(s). Fix before building.`);
  process.exit(1);
}
console.log('[validate] referential integrity ok');
