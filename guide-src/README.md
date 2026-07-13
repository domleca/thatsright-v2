# Guide authoring

The setup guide (EN + FR) lives here. Content is in JSON files; Astro compiles them to static HTML at build time. Vercel serves the output directly — no build step happens on Vercel.

## Where content lives

```
guide-src/src/content/
  steps/        # one JSON file per step
    01-install.json
    02-welcome.json
    03-interview.json
    04-sign-in.json
    05-permissions.json
    06-family-group.json
    07-hand-over.json
  faqs/         # one JSON file per FAQ item
    how-long.json
    mic.json
    …
```

Each file is **bilingual** — it holds both `en` and `fr` fields in a single JSON object. The build fails loudly if a translation key is missing or if a `faqRef` inside a step points to a FAQ slug that doesn't exist.

## Editing content

1. Edit the relevant `.json` file(s) under `guide-src/src/content/`.
2. From the repo root, rebuild:
   ```bash
   npm --prefix guide-src run build
   ```
   This regenerates `guide/`, `fr/guide/`, and `_astro/` (static HTML + shared CSS/JS bundle, all committed to the repo).
3. Run a quick smoke-check locally:
   ```bash
   python3 -m http.server 8000
   # then open http://localhost:8000/guide/ and http://localhost:8000/fr/guide/
   ```
4. **Commit the source and the built output together** — `guide/`, `fr/guide/`, and `_astro/` must all be committed alongside the source changes. Never commit only one side.

## Running tests

```bash
npm --prefix guide-src test
```

Tests cover content validation (required fields, bilingual completeness, slug uniqueness, faqRef resolution). All 18 must pass before committing.

## Build requirements

- Node 18+
- Astro 5.18 requires Vite 6, which requires **vitest v3+**. Do not downgrade vitest.

## Build fails? Common causes

| Error | Fix |
|-------|-----|
| Missing `fr` translation key | Add the French text to the relevant `.json` file |
| Unresolved `faqRef` | The slug in the step's `faqRef` array doesn't match any file in `faqs/` — fix the slug or add the missing FAQ file |
| Vitest version mismatch | Ensure `vitest` in `package.json` is `^3.0.0` or higher |
