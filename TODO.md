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

- [ ] Push `bff0bde` to `origin/main`; verify Vercel deploys and
      `https://www.thatsright.xyz/og.png` returns 200.
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

- [ ] **French copy review.** The page is currently locked to English via
      `FR_ENABLED = false` in the script. French copy still lives in the
      `COPY` dict but is hidden from the public. Once the FR copy is
      reviewed and final, flip the flag to `true` and the language switcher
      reappears automatically.

## Known issues carried over

- [ ] **Hero h1 layout flash on load** (carried from prior memory notes).
      On page load, the hero question renders correctly for a moment and
      then snaps to a worse line-wrap. Needs fresh debug.
