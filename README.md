# That's Right — V2

The V2 redesign of [thatsright.xyz](https://www.thatsright.xyz). A daily
voice presence for someone whose memory has begun to waver.

This is a single-page static site. No build step. Edit `index.html`, hard
refresh, ship.

## Structure

- `index.html` — the page itself. All CSS, copy (EN + FR), and behavior
  scripts are inline.
- `orb.js` — the canvas orb animation engine, loaded by `index.html`.
- `Privacy.html` — the standalone privacy policy page, linked from the
  footer.
- `DESIGN_HANDOFF.md` — the original design brief from the designer
  (kept for reference; describes the V2 visual system in detail).
- `TODO.md` — open items still needed before this is fully production-ready.

## Local preview

From the repo root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. Hard-refresh after edits (⌘+Shift+R)
so CSS/JS isn't cached.

## French copy

French translations live in the `COPY` dict but are currently hidden from
the public: the constant `FR_ENABLED = false` at the top of the inline
script disables the EN/FR switcher and forces English even when a visitor's
browser is set to French. Flip to `true` once the French copy is final.

## Deployment

Auto-deploys to Vercel on push to `main`.
