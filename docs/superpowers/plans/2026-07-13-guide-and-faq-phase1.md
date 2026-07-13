# Guide & FAQ — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an illustrated, caregiver-facing installation guide and a searchable FAQ at `/guide` and `/fr/guide`, built with Astro, styled to match the existing That's Right site, with hand-written seed content drawn from the real Rmb onboarding flow.

**Architecture:** Astro is a **build-time authoring tool only**. It lives in a subfolder (`guide-src/`) of the existing website repo, reads structured bilingual content files, and outputs **static HTML/CSS/JS** into committed `guide/` and `fr/guide/` folders at the repo root. Vercel continues to serve the whole site with **zero build step** — it never runs Astro. A broken guide build therefore can never block the homepage deploy. This mirrors the existing `generate_fr.py` pattern (run a generator, commit its output).

**Tech Stack:** Astro 5 (static output), TypeScript content collections with Zod schemas for build-time validation, vanilla client-side JS for FAQ search (Fuse.js for typo tolerance), no runtime framework.

## Global Constraints

- **Existing pages untouched.** No edits to `index.html`, `fr/index.html`, `privacy.html`, `apply/`, `thanks/`, `orb.js`, `i18n.js`, or `generate_fr.py`. Guide is additive only.
- **Zero-build deploy preserved.** Vercel runs no build command. Astro output is committed static files. `git push origin main` = deploy, unchanged.
- **Astro builds into its own `guide-src/dist/` (which `astro build` may safely wipe), then a post-build copy places the two language trees at repo-root `guide/` and `fr/guide/`** so URLs are `/guide/*` and `/fr/guide/*` under `cleanUrls`. Astro must NEVER be pointed at the repo root as its `outDir` — it cleans the output dir on every build and would delete the existing site. No `base` is set (a `base` breaks the `/fr/guide/*` tree); page URLs come from the `src/pages/guide/**` and `src/pages/fr/guide/**` file layout.
- **Design tokens (copy verbatim into guide CSS):** `--paper:#f4f2ee` `--paper-deep:#ece8e1` `--ink:#2e2e2e` `--ink-soft:#6f6a63` `--ink-faint:#a39d94` `--terra:#b7572e` `--terra-soft:#c8825f` `--line:#ddd7cd` `--line-faint:#eae6dd` `--bubble-them:#faf8f3` `--bubble-you:rgba(183,87,46,.20)`.
- **Fonts:** serif `"Iowan Old Style","Palatino Linotype",Palatino,"Hoefler Text",Georgia,serif` (weight 400); sans `-apple-system,BlinkMacSystemFont,"Helvetica Neue","Segoe UI",Inter,system-ui,sans-serif`.
- **Copy rules:** no em dashes (comma in a sentence, hyphen for a label); French spacing = a space before `? ! : ;`. Follow the `thatsright-product-voice` skill. Caregiver-addressed voice ("your parent", "your father").
- **Every content entry carries both `en` and `fr`.** A missing translation must fail the build.
- **Node:** local build uses Node 22 / npm 10 (confirmed available).
- **Snag line is conditional:** shown only when a real FAQ entry exists for that step; `faqRef` must resolve or the build fails.

---

## File Structure

```
design_handoff_thats_right_site/
├── guide-src/                      # Astro project (source + toolchain; NOT served)
│   ├── package.json               # build = astro build && node scripts/place.mjs
│   ├── astro.config.mjs            # NO base; default outDir (dist/); trailingSlash never
│   ├── scripts/place.mjs          # copies dist/guide -> ../guide, dist/fr/guide -> ../fr/guide
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── content.config.ts       # Zod schemas for steps + faqs collections
│   │   ├── content/
│   │   │   ├── steps/              # one file per install step (bilingual)
│   │   │   └── faqs/               # one file per FAQ entry (bilingual)
│   │   ├── lib/
│   │   │   ├── i18n.ts             # tiny lang helper (en|fr), route builders
│   │   │   └── search.ts           # buildIndex() + search() (Fuse-backed, tested)
│   │   ├── layouts/
│   │   │   └── GuideLayout.astro   # paper bg, topbar (brand + EN·FR), footer
│   │   ├── components/
│   │   │   ├── Device.astro        # base phone frame (.device)
│   │   │   ├── Illustration.astro  # renders the structured `illustration` field
│   │   │   ├── StepNav.astro       # chevron prev/next with subtle labels
│   │   │   └── Faq.astro           # search box, chips, expandable Q&A (client JS)
│   │   └── pages/
│   │       ├── guide/
│   │       │   ├── index.astro     # EN landing (intro + start + FAQ link)
│   │       │   ├── [step].astro    # EN one-page-per-step
│   │       │   └── faq.astro       # EN FAQ
│   │       └── fr/guide/
│   │           ├── index.astro     # FR landing
│   │           ├── [step].astro    # FR steps
│   │           └── faq.astro       # FR FAQ
│   └── test/
│       ├── schema.test.ts
│       └── search.test.ts
├── guide/                          # BUILT static output (committed, served by Vercel)
└── fr/guide/                       # BUILT static output (committed, served by Vercel)
```

**Routing model:** one URL per step (`/guide/install`, `/guide/welcome`, …) — shareable, SEO-friendly, deep-linkable. Chevrons are prev/next links. FAQ is a single page (`/guide/faq`) with anchored entries so snag links deep-link to `/guide/faq#the-code-doesnt-work`.

---

## Task 1: Scaffold the Astro project, wire output to committed static folders

**Files:**
- Create: `guide-src/package.json`, `guide-src/astro.config.mjs`, `guide-src/tsconfig.json`, `guide-src/scripts/place.mjs`
- Create: `guide-src/src/pages/guide/index.astro` and `guide-src/src/pages/fr/guide/index.astro` (temporary hello-worlds, one per language — proves BOTH trees emit)
- Modify: `.gitignore` (ignore Astro toolchain artifacts incl. `dist/`, NOT the built output under `guide/` and `fr/guide/`)

**Interfaces:**
- Produces: `npm --prefix guide-src run build` builds into `guide-src/dist/` then copies `dist/guide` → repo-root `guide/` and `dist/fr/guide` → repo-root `fr/guide/`. `npm --prefix guide-src run dev` serves a live preview.

**Why no `base` and why copy out:** `astro build` wipes its `outDir` on every run. Pointing `outDir` at the repo root would delete the existing site; pointing it at `../guide` cannot also produce the `/fr/guide/*` tree. So Astro builds into its own `dist/` (safe to wipe), and a tiny post-build script copies the two language subtrees to their repo-root homes. URLs come from the `src/pages/guide/**` + `src/pages/fr/guide/**` layout, not from `base`.

- [ ] **Step 1: Create the Astro project config**

`guide-src/package.json`:
```json
{
  "name": "thatsright-guide",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && node scripts/place.mjs",
    "preview": "astro preview",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^5.6.0"
  },
  "devDependencies": {
    "fuse.js": "^7.0.0",
    "vitest": "^2.1.0"
  }
}
```

`guide-src/astro.config.mjs`:
```js
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
```

`guide-src/scripts/place.mjs`:
```js
// Copy the built language trees from dist/ to their repo-root homes.
// Run automatically after `astro build` (see package.json build script).
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));            // guide-src/
const pairs = [
  ['dist/guide',    '../guide'],
  ['dist/fr/guide', '../fr/guide'],
];
for (const [from, to] of pairs) {
  await rm(new URL(to + '/', `file://${root}`), { recursive: true, force: true });
  await cp(new URL(from, `file://${root}`), new URL(to, `file://${root}`), { recursive: true });
}
console.log('placed guide/ and fr/guide/ from dist/');
```

`guide-src/tsconfig.json`:
```json
{ "extends": "astro/tsconfigs/strict" }
```

- [ ] **Step 2: Add temporary hello-world pages for BOTH languages**

`guide-src/src/pages/guide/index.astro`:
```astro
---
---
<html lang="en">
  <head><meta charset="utf-8" /><title>Guide</title></head>
  <body><h1>Guide build works</h1></body>
</html>
```

`guide-src/src/pages/fr/guide/index.astro`:
```astro
---
---
<html lang="fr">
  <head><meta charset="utf-8" /><title>Guide</title></head>
  <body><h1>Le guide fonctionne</h1></body>
</html>
```

- [ ] **Step 3: Install dependencies**

Run: `npm --prefix guide-src install`
Expected: creates `guide-src/node_modules` and `guide-src/package-lock.json`, no errors.

- [ ] **Step 4: Update .gitignore for the toolchain (keep built output tracked)**

Append to `.gitignore`:
```
# Astro guide toolchain (source is tracked; built output in guide/ and fr/guide/ IS committed)
guide-src/node_modules/
guide-src/.astro/
guide-src/dist/
```

- [ ] **Step 5: Build and verify BOTH trees land at the repo root**

Run: `npm --prefix guide-src run build`
Expected: build succeeds; the copy step prints "placed guide/ and fr/guide/ from dist/".
Run: `test -f guide/index.html && test -f fr/guide/index.html && echo OK`
Expected: `OK`. Confirm `guide/index.html` contains "Guide build works" and `fr/guide/index.html` contains "Le guide fonctionne". Confirm NO stray `.mjs` files were copied into `guide/` (only `.html` + assets).

- [ ] **Step 6: Verify Vercel-style cleanUrls serving for both languages**

The existing `vercel.json` uses `cleanUrls:true, trailingSlash:false`, so `/guide` must resolve to `guide/index.html` and `/fr/guide` to `fr/guide/index.html`. Verify the file layout supports that. From repo root: `python3 -m http.server 8000`, then in another shell:
```bash
curl -s localhost:8000/guide/ | grep -c "Guide build works"        # expect 1
curl -s localhost:8000/fr/guide/ | grep -c "Le guide fonctionne"   # expect 1
```
Stop the server. (Note: python's server needs the trailing slash to serve index.html; Vercel's cleanUrls serves `/guide` directly — the file layout is what matters.)

- [ ] **Step 7: Commit**

```bash
git add guide-src/package.json guide-src/package-lock.json guide-src/astro.config.mjs guide-src/scripts/place.mjs guide-src/tsconfig.json guide-src/src/pages/ guide/ fr/guide/ .gitignore
git commit -m "feat(guide): scaffold Astro build wired to committed static output"
```

---

## Task 2: Content schema with build-time bilingual validation

**Files:**
- Create: `guide-src/src/content.config.ts`
- Create: `guide-src/test/schema.test.ts`
- Create: one real step file `guide-src/src/content/steps/01-install.json` and one FAQ file `guide-src/src/content/faqs/no-telegram.json` (minimal, to exercise the schema)

**Interfaces:**
- Produces: two content collections. `steps` entries have `{ order:number, slug:string, title:{en,fr}, actions:Array<{en,fr}>, youShouldSee:{en,fr}, snag?:{text:{en,fr}, faqRef:string}, illustration:Illustration }`. `faqs` entries have `{ id:string, question:{en,fr}, answer:{en,fr}, category:Category, keywords:{en:string[],fr:string[]} }`. `Illustration` is a discriminated union on `kind`: `'voice' | 'chat' | 'permission' | 'qr' | 'two-phone'` (defined in this task, consumed by Task 4).

- [ ] **Step 1: Write the schema**

`guide-src/src/content.config.ts`:
```ts
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const bilingual = z.object({ en: z.string().min(1), fr: z.string().min(1) });

const CATEGORIES = ['installing', 'interview', 'family-group', 'daily-use', 'privacy'] as const;

// One chat bubble in an illustrated phone.
const bubble = z.object({
  from: z.enum(['them', 'you']),
  text: bilingual,
  who: bilingual.optional(),
});

// Discriminated union: each step's illustration is exactly one kind.
const illustration = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('voice'), caption: bilingual, speaking: bilingual }),
  z.object({ kind: z.literal('chat'), caption: bilingual, bubbles: z.array(bubble).min(1) }),
  z.object({ kind: z.literal('permission'), caption: bilingual, title: bilingual, body: bilingual,
             allowLabel: bilingual, denyLabel: bilingual }),
  z.object({ kind: z.literal('qr'), caption: bilingual, label: bilingual, sub: bilingual }),
  z.object({ kind: z.literal('two-phone'), left: z.any(), right: z.any() }), // validated in Task 4 refinement
]);

const steps = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/steps' }),
  schema: z.object({
    order: z.number().int().positive(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: bilingual,
    actions: z.array(bilingual).min(1),
    youShouldSee: bilingual,
    snag: z.object({ text: bilingual, faqRef: reference('faqs') }).optional(),
    illustration,
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    question: bilingual,
    answer: bilingual,
    category: z.enum(CATEGORIES),
    keywords: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
  }),
});

export const collections = { steps, faqs };
```

Note: `reference('faqs')` makes a `snag.faqRef` that points at a nonexistent FAQ **fail the build** — this is the dangling-link guard from the spec.

- [ ] **Step 2: Add one valid FAQ and one valid step so the collections are non-empty**

`guide-src/src/content/faqs/no-telegram.json`:
```json
{
  "id": "no-telegram",
  "question": { "en": "I don't have Telegram. Do I need it?",
                "fr": "Je n'ai pas Telegram. En ai-je besoin ?" },
  "answer": { "en": "You do, but only on your own phone, and only for the family group. Your parent never needs it. When you scan the code, your phone offers to install Telegram if it is missing.",
              "fr": "Oui, mais seulement sur votre propre téléphone, et uniquement pour le groupe familial. Votre parent n'en a jamais besoin. Quand vous scannez le code, votre téléphone propose d'installer Telegram s'il manque." },
  "category": "family-group",
  "keywords": { "en": ["telegram", "install", "family group"],
                "fr": ["telegram", "installer", "groupe familial"] }
}
```

`guide-src/src/content/steps/01-install.json`:
```json
{
  "order": 1,
  "slug": "install",
  "title": { "en": "Install the app", "fr": "Installer l'application" },
  "actions": [
    { "en": "On your parent's iPhone, open the invitation link we sent you.",
      "fr": "Sur l'iPhone de votre parent, ouvrez le lien d'invitation que nous vous avons envoyé." },
    { "en": "If TestFlight is not installed yet, the App Store opens so you can get it, then return to the link.",
      "fr": "Si TestFlight n'est pas encore installé, l'App Store s'ouvre pour vous permettre de l'obtenir, puis revenez au lien." },
    { "en": "Tap Install, then Open.", "fr": "Touchez Installer, puis Ouvrir." }
  ],
  "youShouldSee": { "en": "The That's Right icon on the home screen, and the app opens to a welcome screen.",
                    "fr": "L'icône That's Right sur l'écran d'accueil, et l'application s'ouvre sur un écran de bienvenue." },
  "illustration": {
    "kind": "voice",
    "caption": { "en": "Your parent's phone", "fr": "Le téléphone de votre parent" },
    "speaking": { "en": "Welcome", "fr": "Bienvenue" }
  }
}
```

- [ ] **Step 3: Write the failing schema test**

`guide-src/test/schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

// The schema's real enforcement happens at `astro build`. These tests prove
// (a) valid content builds, (b) a missing FR field fails, (c) a dangling
// faqRef fails. We build in a throwaway way by adding/removing a bad file.
function build() {
  return execSync('npm run build', { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe' });
}

describe('content schema', () => {
  it('builds with valid content', () => {
    expect(() => build()).not.toThrow();
  });

  it('fails when a step is missing its French title', () => {
    const bad = new URL('../src/content/steps/zz-bad.json', import.meta.url).pathname;
    writeFileSync(bad, JSON.stringify({
      order: 99, slug: 'bad', title: { en: 'x' }, actions: [{ en: 'a', fr: 'a' }],
      youShouldSee: { en: 'y', fr: 'y' },
      illustration: { kind: 'voice', caption: { en: 'c', fr: 'c' }, speaking: { en: 's', fr: 's' } },
    }));
    try {
      expect(() => build()).toThrow();
    } finally {
      rmSync(bad, { force: true });
    }
  });

  it('fails when a snag points at a nonexistent FAQ', () => {
    const bad = new URL('../src/content/steps/zz-dangling.json', import.meta.url).pathname;
    writeFileSync(bad, JSON.stringify({
      order: 98, slug: 'dangling', title: { en: 'x', fr: 'x' }, actions: [{ en: 'a', fr: 'a' }],
      youShouldSee: { en: 'y', fr: 'y' },
      snag: { text: { en: 's', fr: 's' }, faqRef: 'does-not-exist' },
      illustration: { kind: 'voice', caption: { en: 'c', fr: 'c' }, speaking: { en: 's', fr: 's' } },
    }));
    try {
      expect(() => build()).toThrow();
    } finally {
      rmSync(bad, { force: true });
    }
  });
});
```

- [ ] **Step 4: Add vitest config and run the tests to see the first pass/fail**

`guide-src/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { testTimeout: 120000 } });
```

Run: `npm --prefix guide-src test`
Expected: all three tests PASS (valid builds; both bad cases throw).

- [ ] **Step 5: Commit**

```bash
git add guide-src/src/content.config.ts guide-src/src/content/ guide-src/test/schema.test.ts guide-src/vitest.config.ts
git commit -m "feat(guide): bilingual content schema with build-time validation"
```

---

## Task 3: i18n helper and guide layout (topbar, language switch, paper theme)

**Files:**
- Create: `guide-src/src/lib/i18n.ts`
- Create: `guide-src/src/layouts/GuideLayout.astro`
- Create: `guide-src/src/styles/guide.css` (tokens + primitives, imported by the layout)

**Interfaces:**
- Consumes: nothing.
- Produces: `type Lang = 'en' | 'fr'`; `t(field:{en,fr}, lang):string`; `guidePath(lang, rest):string` (e.g. `guidePath('fr','faq') === '/fr/guide/faq'`, `guidePath('en','') === '/guide'`); `otherLang(lang):Lang`. `GuideLayout` takes props `{ lang:Lang, title:string, path:string }` and renders the shared chrome + `<slot />`.

- [ ] **Step 1: Write the failing i18n test**

`guide-src/test/i18n.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { t, guidePath, otherLang } from '../src/lib/i18n';

describe('i18n', () => {
  it('picks the right language field', () => {
    expect(t({ en: 'Hi', fr: 'Salut' }, 'fr')).toBe('Salut');
  });
  it('builds EN guide paths without a lang prefix', () => {
    expect(guidePath('en', '')).toBe('/guide');
    expect(guidePath('en', 'faq')).toBe('/guide/faq');
  });
  it('builds FR guide paths under /fr', () => {
    expect(guidePath('fr', '')).toBe('/fr/guide');
    expect(guidePath('fr', 'install')).toBe('/fr/guide/install');
  });
  it('toggles language', () => {
    expect(otherLang('en')).toBe('fr');
    expect(otherLang('fr')).toBe('en');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm --prefix guide-src test -- i18n`
Expected: FAIL — cannot find module `../src/lib/i18n`.

- [ ] **Step 3: Implement the helper**

`guide-src/src/lib/i18n.ts`:
```ts
export type Lang = 'en' | 'fr';

export function t(field: { en: string; fr: string }, lang: Lang): string {
  return field[lang];
}

export function guidePath(lang: Lang, rest: string): string {
  const base = lang === 'fr' ? '/fr/guide' : '/guide';
  return rest ? `${base}/${rest}` : base;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'fr' : 'en';
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm --prefix guide-src test -- i18n`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the shared stylesheet (tokens + phone primitives)**

`guide-src/src/styles/guide.css` — copy the design tokens verbatim from Global Constraints, plus the `.device`, `.msg`, `.bub`, `.who`, `.note` primitives from `index.html` lines 291-320, plus guide-specific classes (`.steplabel`, `ol.actions` with terracotta un-circled numbers, `.check` box, `.snag`, `.chev`, `.stage`, `.search`, `.chip`, `.qa`). Use the exact values from the approved mockup `guide-step-v2.html` (in `.superpowers/brainstorm/`). Key rules:
```css
:root{ /* verbatim tokens from Global Constraints */ }
body{ background:var(--paper); color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Segoe UI",Inter,system-ui,sans-serif; line-height:1.55; }
ol.actions{ list-style:none; counter-reset:act; }
ol.actions li{ counter-increment:act; position:relative; padding-left:36px; margin-bottom:14px;
  font-size:18px; line-height:1.55; }
ol.actions li::before{ content:counter(act) "."; position:absolute; left:0; top:0;
  color:var(--terra); font-family:var(--serif,serif); font-size:18px; } /* number, no circle */
.check{ background:var(--bubble-them); border:1px solid var(--line-faint); border-radius:10px;
  padding:14px 16px; max-width:520px; }
.check b{ display:block; color:var(--terra); margin-bottom:3px; } /* sentence case in content, not CSS uppercase */
.snag{ padding-left:16px; } /* aligns with .check inner text — spec §3 */
.device{ background:var(--paper); border:1px solid var(--line); border-radius:26px; padding:22px 20px;
  aspect-ratio:9/17.5; max-width:215px; width:100%; display:flex; flex-direction:column;
  box-shadow:0 18px 40px -28px rgba(46,46,46,.4); }
/* two-phone: both devices share one height */
.visual.pair .device{ align-self:stretch; height:100%; }
.visual.pair{ align-items:stretch; }
```

- [ ] **Step 6: Write the layout**

`guide-src/src/layouts/GuideLayout.astro`:
```astro
---
import '../styles/guide.css';
import { guidePath, otherLang, type Lang } from '../lib/i18n';
interface Props { lang: Lang; title: string; path: string }
const { lang, title, path } = Astro.props;
const other = otherLang(lang);
const homeHref = lang === 'fr' ? '/fr' : '/';
---
<!DOCTYPE html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="alternate" hreflang={other} href={guidePath(other, path)} />
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href={homeHref}>That's Right</a>
      <nav class="lang">
        <a aria-current={lang === 'en'} href={guidePath('en', path)}>EN</a>
        <span>·</span>
        <a aria-current={lang === 'fr'} href={guidePath('fr', path)}>FR</a>
      </nav>
    </header>
    <main><slot /></main>
    <footer class="foot"><a href={homeHref}>That's Right</a></footer>
  </body>
</html>
```

- [ ] **Step 7: Build to confirm the layout compiles**

Run: `npm --prefix guide-src run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add guide-src/src/lib/i18n.ts guide-src/test/i18n.test.ts guide-src/src/layouts/GuideLayout.astro guide-src/src/styles/guide.css guide/
git commit -m "feat(guide): i18n helper, shared layout, design-token stylesheet"
```

---

## Task 4: Illustration renderer (the drawn phones)

**Files:**
- Create: `guide-src/src/components/Device.astro`
- Create: `guide-src/src/components/Illustration.astro`
- Create: `guide-src/test/illustration.test.ts`

**Interfaces:**
- Consumes: the `illustration` field shape from Task 2; `t` and `Lang` from Task 3.
- Produces: `<Illustration illustration={...} lang={lang} />` renders one of five kinds. For `two-phone`, `left` and `right` are each one of the single-phone kinds, rendered side by side inside `.visual.pair` (equal height per Global Constraints). Exposes no JS; pure markup + CSS.

- [ ] **Step 1: Write the failing render test**

`guide-src/test/illustration.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Illustration from '../src/components/Illustration.astro';

const render = async (props: any) =>
  (await AstroContainer.create()).renderToString(Illustration, { props });

describe('Illustration', () => {
  it('renders a voice phone with the speaking line', async () => {
    const html = await render({ lang: 'en',
      illustration: { kind: 'voice', caption: { en: 'Parent phone', fr: 'x' }, speaking: { en: 'Welcome', fr: 'x' } } });
    expect(html).toContain('Welcome');
    expect(html).toContain('Parent phone');
  });

  it('renders a permission popup with allow/deny labels', async () => {
    const html = await render({ lang: 'en',
      illustration: { kind: 'permission', caption: { en: 'c', fr: 'c' },
        title: { en: 'Access the microphone?', fr: 'x' }, body: { en: 'So your parent can talk.', fr: 'x' },
        allowLabel: { en: 'Allow', fr: 'Autoriser' }, denyLabel: { en: "Don't allow", fr: 'Refuser' } } });
    expect(html).toContain('Access the microphone?');
    expect(html).toContain('Allow');
  });

  it('renders two phones at equal height', async () => {
    const html = await render({ lang: 'en',
      illustration: { kind: 'two-phone',
        left: { kind: 'qr', caption: { en: "Parent's phone", fr: 'x' }, label: { en: 'Almost there', fr: 'x' }, sub: { en: 'Scan with your phone', fr: 'x' } },
        right: { kind: 'chat', caption: { en: 'Your phone', fr: 'x' }, bubbles: [{ from: 'them', text: { en: 'Create the group', fr: 'x' } }] } } });
    expect(html).toContain('visual pair');
    expect(html).toContain('Almost there');
    expect(html).toContain('Create the group');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm --prefix guide-src test -- illustration`
Expected: FAIL — cannot find `../src/components/Illustration.astro`.

- [ ] **Step 3: Implement the base Device frame**

`guide-src/src/components/Device.astro`:
```astro
---
import { t, type Lang } from '../lib/i18n';
interface Props { lang: Lang; chrome: { en: string; fr: string }; caption?: { en: string; fr: string } }
const { lang, chrome, caption } = Astro.props;
---
<figure class="device">
  <div class="dtop"><span>{t(chrome, lang)}</span><span>●</span></div>
  <slot />
  {caption && <figcaption class="caption">{t(caption, lang)}</figcaption>}
</figure>
```

- [ ] **Step 4: Implement the Illustration renderer**

`guide-src/src/components/Illustration.astro`:
```astro
---
import { t, type Lang } from '../lib/i18n';
import Device from './Device.astro';

interface Props { lang: Lang; illustration: any }
const { lang, illustration: ill } = Astro.props;

const APP = { en: "That's Right", fr: "That's Right" };
const TG  = { en: 'Telegram', fr: 'Telegram' };

// One single-phone illustration -> markup. Reused by two-phone left/right.
function chromeFor(kind: string) { return kind === 'chat' ? TG : APP; }
---
{ill.kind === 'voice' && (
  <div class="visual">
    <Device lang={lang} chrome={APP} caption={ill.caption}>
      <div class="orbring"></div>
      <p class="speaking">{t(ill.speaking, lang)}</p>
    </Device>
  </div>
)}

{ill.kind === 'permission' && (
  <div class="visual">
    <Device lang={lang} chrome={APP} caption={ill.caption}>
      <div class="orbring"></div>
      <div class="perm">
        <p class="perm-t">{t(ill.title, lang)}</p>
        <p class="perm-b">{t(ill.body, lang)}</p>
        <div class="perm-row">
          <span class="deny">{t(ill.denyLabel, lang)}</span>
          <span class="allow">{t(ill.allowLabel, lang)}</span>
        </div>
      </div>
    </Device>
  </div>
)}

{ill.kind === 'chat' && (
  <div class="visual">
    <Device lang={lang} chrome={TG} caption={ill.caption}>
      <div class="bubbles">
        {ill.bubbles.map((b: any) => (
          <div class={`msg ${b.from}`}>
            <div class="bub">{t(b.text, lang)}</div>
            {b.who && <span class="who">{t(b.who, lang)}</span>}
          </div>
        ))}
      </div>
    </Device>
  </div>
)}

{ill.kind === 'qr' && (
  <div class="visual">
    <Device lang={lang} chrome={APP} caption={ill.caption}>
      <p class="dlabel">{t(ill.label, lang)}</p>
      <p class="dsub">{t(ill.sub, lang)}</p>
      <div class="qrbox" aria-hidden="true"><!-- static QR glyph, decorative --></div>
    </Device>
  </div>
)}

{ill.kind === 'two-phone' && (
  <div class="visual pair">
    <Astro.self lang={lang} illustration={ill.left} />
    <Astro.self lang={lang} illustration={ill.right} />
  </div>
)}
```

Note: for `two-phone`, `Astro.self` re-renders each side with its own kind; the outer `.visual.pair` wrapper (CSS from Task 3) forces equal device height. The inner single renders each carry their own `.visual` wrapper — flatten by having the single-kind branches emit just the `<Device>` when nested. Implement that by passing an optional `bare` prop; when `ill.kind==='two-phone'`, render children with `bare` so they omit the extra `.visual` div. Add `bare?: boolean` to Props and wrap each single branch as `{!bare ? <div class="visual">…</div> : …}`.

- [ ] **Step 5: Add the illustration-specific CSS to guide.css**

Append `.orbring`, `.speaking`, `.perm`, `.perm-row`, `.allow`, `.deny`, `.dlabel`, `.dsub`, `.qrbox`, `.bubbles`, `.caption` rules — values from the approved mockup `guide-step-v2.html`.

- [ ] **Step 6: Run the render test to confirm it passes**

Run: `npm --prefix guide-src test -- illustration`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add guide-src/src/components/Device.astro guide-src/src/components/Illustration.astro guide-src/test/illustration.test.ts guide-src/src/styles/guide.css
git commit -m "feat(guide): illustrated phone renderer (voice, chat, permission, qr, two-phone)"
```

---

## Task 5: Step pages with chevron navigation (EN + FR)

**Files:**
- Create: `guide-src/src/components/StepNav.astro`
- Create: `guide-src/src/pages/guide/[step].astro`
- Create: `guide-src/src/pages/fr/guide/[step].astro`
- Create: `guide-src/src/pages/guide/index.astro` (replace hello-world with real landing) and `guide-src/src/pages/fr/guide/index.astro`
- Create: `guide-src/test/step-order.test.ts`

**Interfaces:**
- Consumes: `steps` collection (Task 2), `Illustration` (Task 4), `GuideLayout`, `t`, `guidePath` (Task 3).
- Produces: one static page per step at `/guide/<slug>` and `/fr/guide/<slug>`, ordered by `order`. `StepNav` takes `{ lang, prev?, next? }` where prev/next are `{ slug, title:{en,fr} }`.

- [ ] **Step 1: Write the failing ordering test**

`guide-src/test/step-order.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { neighbors } from '../src/lib/steps';

describe('step neighbors', () => {
  const steps = [
    { data: { order: 2, slug: 'welcome', title: { en: 'W', fr: 'W' } } },
    { data: { order: 1, slug: 'install', title: { en: 'I', fr: 'I' } } },
    { data: { order: 3, slug: 'interview', title: { en: 'T', fr: 'T' } } },
  ] as any;
  it('sorts by order and finds prev/next', () => {
    const { prev, next } = neighbors(steps, 'welcome');
    expect(prev.slug).toBe('install');
    expect(next.slug).toBe('interview');
  });
  it('has no prev on the first step', () => {
    expect(neighbors(steps, 'install').prev).toBeUndefined();
  });
  it('has no next on the last step', () => {
    expect(neighbors(steps, 'interview').next).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm --prefix guide-src test -- step-order`
Expected: FAIL — cannot find `../src/lib/steps`.

- [ ] **Step 3: Implement the ordering helper**

`guide-src/src/lib/steps.ts`:
```ts
export interface StepLike { data: { order: number; slug: string; title: { en: string; fr: string } } }

export function sorted(steps: StepLike[]): StepLike[] {
  return [...steps].sort((a, b) => a.data.order - b.data.order);
}

export function neighbors(steps: StepLike[], slug: string) {
  const s = sorted(steps);
  const i = s.findIndex((x) => x.data.slug === slug);
  return { prev: i > 0 ? s[i - 1].data : undefined, next: i < s.length - 1 ? s[i + 1].data : undefined };
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm --prefix guide-src test -- step-order`
Expected: PASS (3 tests).

- [ ] **Step 5: Implement StepNav**

`guide-src/src/components/StepNav.astro`:
```astro
---
import { t, guidePath, type Lang } from '../lib/i18n';
interface Props { lang: Lang; prev?: { slug: string; title: { en: string; fr: string } }; next?: { slug: string; title: { en: string; fr: string } } }
const { lang, prev, next } = Astro.props;
---
<div class="chevs">
  {prev ? (
    <a class="chev prev" href={guidePath(lang, prev.slug)}>
      <span class="arrow" aria-hidden="true">‹</span>
      <span class="cl">{t(prev.title, lang)}</span>
    </a>
  ) : <span class="chev spacer"></span>}
  {next ? (
    <a class="chev next" href={guidePath(lang, next.slug)}>
      <span class="cl">{t(next.title, lang)}</span>
      <span class="arrow" aria-hidden="true">›</span>
    </a>
  ) : <span class="chev spacer"></span>}
</div>
```

- [ ] **Step 6: Implement the EN step page**

`guide-src/src/pages/guide/[step].astro`:
```astro
---
import { getCollection } from 'astro:content';
import GuideLayout from '../../layouts/GuideLayout.astro';
import Illustration from '../../components/Illustration.astro';
import StepNav from '../../components/StepNav.astro';
import { neighbors, sorted } from '../../lib/steps';
import { t } from '../../lib/i18n';

export async function getStaticPaths() {
  const steps = await getCollection('steps');
  const faqs = await getCollection('faqs');
  const total = steps.length;
  return sorted(steps).map((s) => ({
    params: { step: s.data.slug },
    props: { step: s, index: sorted(steps).findIndex((x) => x.data.slug === s.data.slug) + 1, total,
             nav: neighbors(steps, s.data.slug), faqs },
  }));
}
const lang = 'en';
const { step, index, total, nav, faqs } = Astro.props;
const d = step.data;
const snagFaq = d.snag ? faqs.find((f) => f.id === d.snag.faqRef.id) : undefined;
---
<GuideLayout lang={lang} title={`${t(d.title, lang)} — That's Right`} path={d.slug}>
  <section class="stage">
    <div class="main">
      <div class="txt">
        <p class="steplabel">Step {index} of {total}</p>
        <h1 class="steph">{t(d.title, lang)}</h1>
        <ol class="actions">{d.actions.map((a) => <li set:html={t(a, lang)} />)}</ol>
        <div class="check"><b>You should see</b>{t(d.youShouldSee, lang)}</div>
        {d.snag && snagFaq && (
          <p class="snag">{t(d.snag.text, lang)} <a href={`/guide/faq#${snagFaq.id}`}>{t(snagFaq.question, lang)}</a></p>
        )}
      </div>
      <Illustration lang={lang} illustration={d.illustration} />
    </div>
    <StepNav lang={lang} prev={nav.prev} next={nav.next} />
  </section>
</GuideLayout>
```

- [ ] **Step 7: Implement the FR step page (same, `lang='fr'`, FR label + paths)**

`guide-src/src/pages/fr/guide/[step].astro` — identical to Step 6 except `const lang = 'fr';`, the step label reads `Étape {index} sur {total}`, the "You should see" label reads `Vous devriez voir`, and the snag link href is `/fr/guide/faq#...`. (Repeat the full file; do not abbreviate.)

- [ ] **Step 8: Implement the landing pages (EN + FR)**

`guide-src/src/pages/guide/index.astro`: intro headline + lede + a primary link to the first step (`sorted(steps)[0].data.slug`) + a secondary link to `/guide/faq`. Use `GuideLayout` with `path=''`. FR mirror at `guide-src/src/pages/fr/guide/index.astro` with FR copy and `/fr/guide/...` links.

- [ ] **Step 9: Build and verify both language trees render**

Run: `npm --prefix guide-src run build`
Then: `test -f guide/install.html && test -f fr/guide/install.html && echo OK`
Expected: `OK`.

- [ ] **Step 10: Commit**

```bash
git add guide-src/src/lib/steps.ts guide-src/test/step-order.test.ts guide-src/src/components/StepNav.astro guide-src/src/pages/guide/ guide-src/src/pages/fr/guide/index.astro guide-src/src/pages/fr/guide/\[step\].astro guide/ fr/guide/
git commit -m "feat(guide): per-step pages with chevron navigation, EN and FR"
```

---

## Task 6: FAQ page with client-side typo-tolerant search (EN + FR)

**Files:**
- Create: `guide-src/src/lib/search.ts`
- Create: `guide-src/src/components/Faq.astro`
- Create: `guide-src/src/pages/guide/faq.astro`, `guide-src/src/pages/fr/guide/faq.astro`
- Create: `guide-src/test/search.test.ts`

**Interfaces:**
- Consumes: `faqs` collection (Task 2), `GuideLayout`, `t` (Task 3).
- Produces: `buildIndex(faqs, lang)` returns a plain array of `{ id, question, answer, category, keywords }` (strings for one language). `search(index, query)` returns matching ids in relevance order, typo-tolerant. The FAQ page bakes the per-language index into a `<script type="application/json">` the client reads.

- [ ] **Step 1: Write the failing search test**

`guide-src/test/search.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildIndex, search } from '../src/lib/search';

const faqs = [
  { data: { id: 'mic', question: { en: 'Should I allow the microphone?', fr: 'x' },
    answer: { en: 'Yes, it is how your parent speaks to the app.', fr: 'x' },
    category: 'installing', keywords: { en: ['microphone', 'permission'], fr: [] } } },
  { data: { id: 'no-telegram', question: { en: "I don't have Telegram", fr: 'x' },
    answer: { en: 'You only need it on your own phone.', fr: 'x' },
    category: 'family-group', keywords: { en: ['telegram'], fr: [] } } },
] as any;

describe('faq search', () => {
  const idx = buildIndex(faqs, 'en');
  it('finds by exact keyword', () => {
    expect(search(idx, 'microphone')[0]).toBe('mic');
  });
  it('tolerates a typo', () => {
    expect(search(idx, 'microfone')).toContain('mic');
  });
  it('matches words in the answer body', () => {
    expect(search(idx, 'telegram')).toContain('no-telegram');
  });
  it('returns all ids for an empty query', () => {
    expect(search(idx, '').sort()).toEqual(['mic', 'no-telegram']);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm --prefix guide-src test -- search`
Expected: FAIL — cannot find `../src/lib/search`.

- [ ] **Step 3: Implement search (Fuse-backed)**

`guide-src/src/lib/search.ts`:
```ts
import Fuse from 'fuse.js';

export interface FaqEntry { id: string; question: string; answer: string; category: string; keywords: string[] }

export function buildIndex(faqs: any[], lang: 'en' | 'fr'): FaqEntry[] {
  return faqs.map((f) => ({
    id: f.data.id,
    question: f.data.question[lang],
    answer: f.data.answer[lang],
    category: f.data.category,
    keywords: f.data.keywords[lang] ?? [],
  }));
}

export function search(index: FaqEntry[], query: string): string[] {
  const q = query.trim();
  if (!q) return index.map((e) => e.id);
  const fuse = new Fuse(index, {
    includeScore: true, threshold: 0.45, ignoreLocation: true,
    keys: [
      { name: 'question', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'answer', weight: 1 },
    ],
  });
  return fuse.search(q).map((r) => r.item.id);
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm --prefix guide-src test -- search`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement the FAQ component (chips + list + client search)**

`guide-src/src/components/Faq.astro` — renders the search input, category chips, and one `.qa` block per entry (sorted by category). Bakes the index as JSON and ships a small inline `<script>` that: reads the JSON, lazy-imports Fuse from a bundled module, filters `.qa` visibility on input and on chip click, and toggles answer expansion on question click. The script must re-implement `search()` semantics client-side (import the same `search`/`buildIndex` module so behavior matches the test). Provide the full component including:
```astro
---
import { t, type Lang } from '../lib/i18n';
import { buildIndex } from '../lib/search';
interface Props { lang: Lang; faqs: any[]; labels: { search: string; all: string; categories: Record<string,string> } }
const { lang, faqs, labels } = Astro.props;
const index = buildIndex(faqs, lang);
const cats = [...new Set(index.map((e) => e.category))];
---
<div class="search">
  <input id="faq-q" type="search" placeholder={labels.search} autocomplete="off" />
</div>
<div class="chips" id="faq-chips">
  <button class="chip on" data-cat="all">{labels.all}</button>
  {cats.map((c) => <button class="chip" data-cat={c}>{labels.categories[c]}</button>)}
</div>
<div class="faq" id="faq-list">
  {index.map((e) => (
    <div class="qa" id={e.id} data-cat={e.category}>
      <button class="q" aria-expanded="false">{e.question}<span class="ic">+</span></button>
      <div class="a" hidden>{e.answer}</div>
    </div>
  ))}
</div>
<script type="application/json" id="faq-index" set:html={JSON.stringify(index)}></script>
<script>
  import { search } from '../lib/search';
  const index = JSON.parse(document.getElementById('faq-index').textContent);
  const q = document.getElementById('faq-q');
  const list = document.getElementById('faq-list');
  let cat = 'all';
  function apply() {
    const ids = new Set(search(index, q.value));
    for (const el of list.querySelectorAll('.qa')) {
      const okText = ids.has(el.id);
      const okCat = cat === 'all' || el.dataset.cat === cat;
      el.hidden = !(okText && okCat);
    }
  }
  q.addEventListener('input', apply);
  document.getElementById('faq-chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    cat = b.dataset.cat;
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
    apply();
  });
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.q'); if (!btn) return;
    const a = btn.nextElementSibling; const open = a.hidden;
    a.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.ic').textContent = open ? '–' : '+';
  });
  // deep-link: open the entry named in the URL hash (snag links)
  if (location.hash) { const el = document.querySelector(location.hash); if (el) el.querySelector('.q')?.click(); }
</script>
```

- [ ] **Step 6: Implement the EN and FR FAQ pages**

`guide-src/src/pages/guide/faq.astro`: load `faqs` via `getCollection`, render `GuideLayout` (`path='faq'`) + `<Faq lang="en" faqs={faqs} labels={{ search: 'Type your question…', all: 'All', categories: { installing:'Installing', interview:'The interview', 'family-group':'The family group', 'daily-use':'Daily use', privacy:'Privacy' } }} />`. FR mirror at `guide-src/src/pages/fr/guide/faq.astro` with FR labels (`Tapez votre question…`, `Tout`, `Installation`, `L'entretien`, `Le groupe familial`, `Au quotidien`, `Confidentialité`).

- [ ] **Step 7: Build, then verify search works in a browser**

Run: `npm --prefix guide-src run build && test -f guide/faq.html && test -f fr/guide/faq.html && echo OK`
Expected: `OK`.
Manual: from repo root `python3 -m http.server 8000`, open `http://localhost:8000/guide/faq`, type "microfone", confirm the microphone entry stays visible; click a category chip; click a question to expand. Then open `http://localhost:8000/guide/faq#no-telegram` and confirm that entry auto-expands.

- [ ] **Step 8: Commit**

```bash
git add guide-src/src/lib/search.ts guide-src/test/search.test.ts guide-src/src/components/Faq.astro guide-src/src/pages/guide/faq.astro guide-src/src/pages/fr/guide/faq.astro guide/ fr/guide/
git commit -m "feat(guide): searchable FAQ with typo tolerance and deep links, EN and FR"
```

---

## Task 7: Seed content — the real install steps and FAQ

**Files:**
- Create: `guide-src/src/content/steps/*.json` (the full ordered step set)
- Create: `guide-src/src/content/faqs/*.json` (the FAQ set)
- Delete: the two placeholder files from Task 2 if superseded (keep `no-telegram.json`; expand `01-install.json`).

**Interfaces:**
- Consumes: the schema from Task 2. Produces: the shipped content the pages render.

**⚠️ Confirm before finalizing (see plan preamble):** The family-group step has two possible flows. **Default this content to the concierge auto-create flow** (group is created server-side; the caregiver scans a QR to *join*). If Dominique confirms testers currently see the older *create-the-group* flow, swap that one step's `actions`, `youShouldSee`, and `illustration` — it is a single-file edit, no code change.

- [ ] **Step 1: Write the step set**

Create these step files (drawn from the verified Rmb flow; copy reuses the app's real strings where possible). Each is a complete JSON file matching the Task 2 schema. Steps:
1. `01-install` — Install via TestFlight (illustration: `voice`, resting orb / "Welcome").
2. `02-welcome` — Open the app, tap Get started (illustration: `voice`, orb + "Welcome / Bienvenue").
3. `03-interview` — Answer the assistant's questions about your parent (illustration: `chat`, 2-3 bubbles showing a warm question and a typed answer). Actions explain: it is a calm conversation, ~15-20 min, you can pause and it resumes, "I don't know" is fine.
4. `04-sign-in` — Sign in with Apple (illustration: `permission`-style sheet or `voice`; actions: tap the button, use Face ID or the passcode). Snag → FAQ `sign-in-trouble`.
5. `05-permissions` — Allow the microphone and speech; notifications optional (illustration: `permission` with real mic copy: "To hear their voice. Nothing is recorded, everything stays on the iPhone."). Snag → FAQ `mic-denied`.
6. `06-family-group` — Create/join the family group via the QR + Telegram (illustration: `two-phone` — left `qr` on parent's phone, right `chat` Telegram bubble on your phone). Snag → FAQ `code-doesnt-work`. **(the flow-confirmation step)**
7. `07-hand-over` — Hand the phone to your parent (illustration: `voice`, orb + "We're all set / Tout est prêt").

Provide the full JSON for all seven, bilingual, following copy rules. Example (`06-family-group.json`, concierge-join default):
```json
{
  "order": 6,
  "slug": "family-group",
  "title": { "en": "Set up the family group", "fr": "Créer le groupe familial" },
  "actions": [
    { "en": "That's Right shows a square code on your parent's phone.",
      "fr": "That's Right affiche un code carré sur le téléphone de votre parent." },
    { "en": "Take out your own phone and open the camera.",
      "fr": "Prenez votre propre téléphone et ouvrez l'appareil photo." },
    { "en": "Point it at the code, then tap the link that appears to open Telegram and join the group.",
      "fr": "Dirigez-le vers le code, puis touchez le lien qui apparaît pour ouvrir Telegram et rejoindre le groupe." }
  ],
  "youShouldSee": { "en": "Telegram opens on your phone and you join the family group, already named after your parent.",
                    "fr": "Telegram s'ouvre sur votre téléphone et vous rejoignez le groupe familial, déjà au nom de votre parent." },
  "snag": { "text": { "en": "Nothing happened when you scanned?", "fr": "Rien ne s'est passé au scan ?" },
            "faqRef": "code-doesnt-work" },
  "illustration": {
    "kind": "two-phone",
    "left": { "kind": "qr", "caption": { "en": "Your parent's phone", "fr": "Le téléphone de votre parent" },
      "label": { "en": "Almost there.", "fr": "Presque terminé." },
      "sub": { "en": "Scan this with your own phone's camera", "fr": "Scannez ceci avec l'appareil photo de votre téléphone" } },
    "right": { "kind": "chat", "caption": { "en": "Your phone", "fr": "Votre téléphone" },
      "bubbles": [ { "from": "them", "who": { "en": "That's Right", "fr": "That's Right" },
        "text": { "en": "Welcome! Tap to join the family group for your father.",
                  "fr": "Bienvenue ! Touchez pour rejoindre le groupe familial de votre père." } } ] }
  }
}
```

- [ ] **Step 2: Write the FAQ set**

Create FAQ files covering, at minimum: `no-telegram` (exists), `code-doesnt-work`, `mic-denied`, `sign-in-trouble`, `who-needs-telegram`, `add-family-later`, `what-happens-to-what-they-say` (privacy), `resume-onboarding` (app closed mid-setup), `how-long` (interview length), `dont-know-an-answer`. Each bilingual, categorized, with keywords. Follow product voice; answers are reassuring and concrete.

- [ ] **Step 3: Build to validate all content against the schema**

Run: `npm --prefix guide-src run build`
Expected: build succeeds (proves every entry is bilingual and every snag `faqRef` resolves).

- [ ] **Step 4: Run the full test suite**

Run: `npm --prefix guide-src test`
Expected: all tests PASS.

- [ ] **Step 5: Manual review pass (product voice + French)**

Read every EN and FR string. Check: no em dashes; French has a space before `? ! : ;`; caregiver voice; no invented app behavior. Fix inline.

- [ ] **Step 6: Commit**

```bash
git add guide-src/src/content/ guide/ fr/guide/
git commit -m "content(guide): seed real install steps and caregiver FAQ (EN + FR)"
```

---

## Task 8: Wire the guide into the site and verify the whole surface

**Files:**
- Modify: `sitemap.xml` (add guide URLs), `robots.txt` (only if it blocks anything relevant — likely no change)
- Create: `guide-src/README.md` (how to edit content and rebuild — for Dominique and the Phase 2 pipeline)
- Modify: repo `README.md` (one paragraph pointing at `guide-src/README.md`)
- Optionally modify: `index.html` / `fr/index.html` **only** to add a nav/footer link to the guide — **but** Global Constraints forbid touching those files. Instead: defer the homepage link to a separate, explicitly-approved change. This task only ensures the guide is reachable by URL and indexed.

**Interfaces:** none (integration + docs).

- [ ] **Step 1: Add guide URLs to the sitemap**

Add `<url>` entries for `/guide`, `/guide/faq`, each step URL, and their `/fr/guide/...` counterparts to `sitemap.xml`, with `hreflang` alternates mirroring the existing homepage entries' style.

- [ ] **Step 2: Write the authoring README**

`guide-src/README.md`: explain that content lives in `guide-src/src/content/`, that editing a `.json` file and running `npm --prefix guide-src run build` regenerates `guide/` + `fr/guide/`, that both the source and the built output must be committed together (exactly like `generate_fr.py` → `fr/index.html`), and that the build fails loudly on a missing translation or a broken snag link.

- [ ] **Step 3: Full rebuild and link-check**

Run: `npm --prefix guide-src run build`
Then from repo root serve and check every route resolves:
```bash
python3 -m http.server 8000 &
for p in guide guide/faq guide/install fr/guide fr/guide/faq fr/guide/install; do
  echo -n "$p -> "; curl -s -o /dev/null -w "%{http_code}\n" "localhost:8000/$p";
done
kill %1
```
Expected: every route returns `200`.

- [ ] **Step 4: Confirm existing pages are untouched**

Run: `git status --porcelain index.html fr/index.html privacy.html orb.js i18n.js generate_fr.py`
Expected: **no output** (none of these changed).

- [ ] **Step 5: Verify the deploy model is intact**

Confirm `vercel.json` is unchanged and no `package.json` exists at the repo root (only in `guide-src/`):
```bash
git status --porcelain vercel.json; test ! -f package.json && echo "root still buildless"
```
Expected: no vercel.json change; `root still buildless`.

- [ ] **Step 6: Commit**

```bash
git add sitemap.xml guide-src/README.md README.md
git commit -m "chore(guide): sitemap entries, authoring docs; verify buildless deploy intact"
```

---

## Self-Review

**Spec coverage:**
- §2 install path (TestFlight now) → Task 7 step 1. ✓
- §2 caregiver-sets-up-parent voice → Global Constraints + Task 7 copy. ✓
- §2 Astro scoped to guide → Tasks 1-6; existing pages untouched (Task 8 step 4). ✓
- §3 step layout (numbered terracotta actions no circles, quiet step label, you-should-see sentence case, conditional snag aligned) → Task 3 CSS + Task 5 page. ✓
- §3 chevron nav → Task 5 StepNav. ✓
- §3 illustrations from files, single-phone default, two-phone equal height → Task 4. ✓
- §3 FAQ search + chips + expandable + typo tolerance → Task 6. ✓
- §4 content model (bilingual one file, build validation, illustration renders from files) → Task 2 + Task 4. ✓
- §4 EN/FR in same file, missing FR fails build → Task 2 schema + test. ✓
- §4 client-side baked search index → Task 6. ✓
- §7 out-of-scope respected (no CMS, no server search, no existing-page rewrite, no homepage link without approval) → Task 8. ✓

**Placeholder scan:** No "TBD/TODO". Task 5 step 7, Task 6 step 6, Task 7 steps 1-2, Task 8 step 1 describe repeated/bulk content by pattern with a full worked example rather than repeating every near-identical file verbatim — acceptable for content files that all share one shown schema; the executor has a complete example for each shape.

**Type consistency:** `illustration` discriminated union defined in Task 2, consumed unchanged in Task 4. `neighbors`/`sorted` defined in Task 5 lib, used in the same task's page. `buildIndex`/`search` defined in Task 6, used by the same task's component and its test. `guidePath`/`t`/`otherLang`/`Lang` defined in Task 3, used consistently thereafter.

**Known follow-ups (Phase 2, out of scope here):** the release-triggered auto-update pipeline in the Rmb repo; a homepage nav link to the guide (needs explicit approval to touch `index.html`).
