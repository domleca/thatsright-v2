# That's Right — V2 — Open Items

Things that still need to land before this site is fully production-ready.
Tracked here so they don't get lost across sessions.

## Blockers before this is "really" public

- [ ] **Wire up the "Request access" email backend.** Both Request access
      buttons (top nav + email gate at the bottom) currently submit nowhere —
      the markup is in place but there's no `<form action>`, no handler, no
      service connected. Decide on a destination (mailto, Formspree, Resend,
      ConvertKit, etc.) and wire it.
- [ ] **Meta tags & social sharing.** Add Open Graph title/description/image,
      Twitter card, and proper `<meta name="description">` so the URL previews
      nicely on iMessage / Slack / WhatsApp. None of that is set right now —
      the page will share as a blank preview.
- [ ] **Favicon.** No favicon is set, so the browser tab shows a default icon.

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
