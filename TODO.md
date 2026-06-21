# That's Right — V2 — Open Items

Things that still need to land before this site is fully production-ready.
Tracked here so they don't get lost across sessions.

## Blockers before this is "really" public

- [x] ~~Wire up the "Request access" email backend.~~ Done in the live `TRW/`
      site — form posts to Formspree (`xojzbled`). Top nav + hero CTA both
      scroll to the single form at the bottom.
- [x] ~~**Meta tags & social sharing.**~~ Done in commit `bff0bde` (unpushed
      at end of 2026-06-21 session). Added: per-page meta description +
      canonical, Open Graph (title/desc/image, locale en_US + fr_FR alternate),
      Twitter `summary_large_image` card, 3 JSON-LD blocks (Organization w/
      Dom Leca as founder, WebSite, SoftwareApplication iOS PreOrder). Static
      assets at repo root: `og.png` (1200×630, cream bg + orb + wordmark),
      `robots.txt`, `sitemap.xml`, `llms.txt`. `vercel.json` adds `cleanUrls`
      and 301s the old `Privacy.html` → `/privacy`. Privacy file renamed to
      lowercase. **Next: push to trigger Vercel deploy.**

## SEO follow-ups (post-deploy)

- [x] ~~Push `bff0bde` to `origin/main`; verify Vercel deploys and
      `https://www.thatsright.xyz/og.png` returns 200.~~ Done 2026-06-21.
      All five static assets (og.png, sitemap.xml, robots.txt, llms.txt,
      privacy) return 200 on prod. Homepage emits 3 JSON-LD blocks, OG +
      Twitter cards, canonical, en_US/fr_FR alternate locale.
- Note: `og.png` is the cream variant ("A steady presence when memory
      wavers"); `og-dark.png` is the dark/inverted alternative kept in
      the repo as backup. Swap by renaming if we ever want the dark card.
- [ ] Validate with https://www.opengraph.xyz/ (share-card preview) and
      https://search.google.com/test/rich-results (JSON-LD).
- [ ] Submit `https://www.thatsright.xyz/sitemap.xml` to Google Search Console
      and Bing Webmaster Tools (verify ownership first, DNS TXT record or
      HTML file).
- [ ] Flip `availability` in the `SoftwareApplication` JSON-LD from
      `PreOrder` to `InStock` once the app is publicly available.
- [ ] **Decide on French SEO.** Today French ships via runtime JS swap and
      isn't independently indexed by Google. Bilingual indexing would need
      either pre-rendering (small build step — against V2's "no build" rule)
      or hand-maintained `/fr/` HTML files. Defer until French discovery
      becomes a real priority.
- [x] ~~Favicon.~~ Done — generated from iOS AppIcon-1024.png (32×32, 180×180 Apple touch, 192×192 Android).

## Translation

- [x] ~~**French copy review.**~~ Done 2026-06-21. French copy reviewed and
      reintegrated; `FR_ENABLED = true` in `i18n.js`, the EN/FR switcher is
      live on desktop. (Note: this only affects the public UI — the
      "Decide on French SEO" item above is still open and the site still
      ships only English to indexers.)

## Known issues carried over

- [x] ~~**Hero h1 layout flash on load.**~~ Fixed 2026-06-21. Root cause:
      `#q h1` used `max-width: 14ch`; `ch` is the width of "0" in the
      currently-resolved font, so it shifted between the initial paint
      (generic serif fallback) and the final paint (Iowan/Palatino),
      re-wrapping the line. Replaced the `ch` cap with `min(720px, 92vw)`
      so the constraint no longer depends on which serif is loaded.
