# That's Right — V2 — Open Items

Things that still need to land before this site is fully production-ready.
Tracked here so they don't get lost across sessions.

## Blockers before this is "really" public

- [x] ~~Wire up the "Request access" email backend.~~ Done in the live `TRW/`
      site — form posts to Formspree (`xojzbled`). Top nav + hero CTA both
      scroll to the single form at the bottom.
- [ ] **Meta tags & social sharing.** Add Open Graph title/description/image,
      Twitter card, and proper `<meta name="description">` so the URL previews
      nicely on iMessage / Slack / WhatsApp. None of that is set right now —
      the page will share as a blank preview.
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
