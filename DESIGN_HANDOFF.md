# Handoff: "That's Right" — marketing / landing site

## Overview
A single-page, scroll-driven landing site for **That's Right** — a daily voice
companion for someone (e.g. a parent with Alzheimer's) whose memory has begun to
waver. The page is an emotional narrative told in vertical "beats": a question,
the cost of repetition, the product promise (an animated orb), how it works
(three steps with phone mockups), a personal founder note, a privacy stance, and
an email-gate CTA. Bilingual (EN / FR) with a language switcher; copy is also
structured around a "tone" mode (currently only `kindness` is wired in the UI).

## About the Design Files
The files in this bundle are **design references created in HTML/CSS/JS** — a
working prototype showing the intended look, motion, and behavior. They are
**not** meant to be dropped into production as-is. The task is to **recreate
this design in the target codebase's environment** (React/Next, Vue, Astro,
etc.) using its established component patterns, i18n solution, and build
tooling. If no environment exists yet, pick an appropriate modern stack
(a static-friendly framework like Astro or Next is a good fit — this is a
content/marketing page) and implement it there.

The orb is the one piece worth porting almost verbatim (see Assets).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions.
Recreate the UI faithfully. Exact tokens and values are listed below.

---

## Design Tokens

### Color (CSS custom properties, from `:root`)
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#f4f2ee` | page background (warm off-white) |
| `--paper-deep` | `#ece8e1` | CTA / gate section background |
| `--ink` | `#2e2e2e` | primary text, dark buttons, orb stroke |
| `--ink-soft` | `#6f6a63` | secondary/body text |
| `--ink-faint` | `#a39d94` | eyebrows, captions, footer text |
| `--terra` | `#b7572e` | accent — links-on-hover, names, emphasis |
| `--terra-soft` | `#c8825f` | accent on dark backgrounds |
| `--line` | `#ddd7cd` | borders (device, inputs) |
| `--line-faint` | `#eae6dd` | hairline dividers between steps |
| `--bubble-them` | `#faf8f3` | bot ("That's Right") chat bubble fill |
| `--bubble-you` | `#3c352d` | user/family chat bubble fill (warm near-black) |

Note: the dark user bubble uses `#3c352d` (a warm dark gray) deliberately — **not
pure black** — with `#f4f2ee` text.

### Typography
- **Serif** (headlines, ledes, device labels): `"Iowan Old Style","Palatino
  Linotype",Palatino,"Hoefler Text",Georgia,serif`. Weight 400 throughout;
  `letter-spacing:-0.01em` on large headings.
- **Sans** (body, UI): system stack — `-apple-system,BlinkMacSystemFont,
  "Helvetica Neue","Segoe UI",Inter,system-ui,sans-serif`.
- Body `line-height:1.55`; longform paragraphs `1.7`.

Type scale (all `clamp(min, vw, max)` — desktop max in parens):
| Element | Size |
|---|---|
| `#q h1` (opening question) | `clamp(34px, 6.2vw, 62px)` / lh 1.18 |
| `.lede`, `.hinge` (cost beat) | `clamp(21px, 2.8vw, 27px)` / lh 1.5 |
| `.presence` (promise) | `clamp(26px, 4vw, 40px)` / lh 1.32 |
| `.sub` | `clamp(16px, 2vw, 18px)` → **17.5px on mobile** |
| `.eyebrow` | 12px, `letter-spacing:.2em`, uppercase |
| `.step h3` | `clamp(24px, 2.8vw, 28px)` |
| `.step p` | 17px → **18px on mobile** |
| `#why h2` | `clamp(28px, 4vw, 40px)`; `#why p` 18px |
| `#privacy h2` | `clamp(26px, 3.6vw, 36px)`; `#privacy p` 17px |
| `#gate h2` | `clamp(28px, 4vw, 40px)`; `#gate p` 16px |
| device note / bullets / bubbles | 12.5–13px → **bumped to 13.5–14px on mobile** |

**Mobile note:** below 680px the in-phone demo text is intentionally enlarged and
the body paragraphs raised to ~17.5–18px so nothing reads below the ~16px mobile
minimum. Keep this when porting — don't let the demo text shrink on small screens.

### Spacing / layout
- Section ("beat") rhythm: `min-height:100vh`, `padding:120px 28px`, content
  `max-width:760px` centered. On mobile: `min-height:auto`, `padding:60px 22px`.
- `#how` is wider (`max-width:880px`) and shorter (`min-height:auto`).
- `#why`, `#privacy` constrained to `max-width:640px`.
- Border radius: device `26px`, chat bubbles `14px` (with one corner tightened
  to `4px` on the sender side), inputs/buttons `10px`.
- Shadow (device): `0 18px 40px -28px rgba(46,46,46,.4)`.
- Breakpoints: **680px** (layout collapse to single column) and **420px**
  (tighten top bar).

---

## Screens / Sections (top to bottom)

All sections are `<section>` blocks in one scrolling page. A fixed top bar
(`.topbar`, `mix-blend-mode:multiply`, non-interactive except brand + lang
switch) overlays everything.

1. **Top bar** — brand wordmark "That's Right" (left); language switcher EN · FR
   (right), built dynamically from a `LANGS` registry.

2. **#q — The question** (full viewport, centered): serif `h1`
   ("When you can't be there, who answers?") + an animated chevron scroll cue
   (`@keyframes nudge`, infinite).

3. **#cost — The cost**: a serif lede about repeated questions (with an italic,
   muted `.qs` span) and a `.hinge` line whose `<b>` is rendered in italic terra
   accent ("But someone can always answer.").

4. **#answer — The promise** (centered): the **hero orb** (animated `<canvas>`,
   proximity-reactive) above a serif `.presence` line and a `.sub` subhead.

5. **#how — How it works**: an eyebrow + three `.step` rows. Each step is a
   2-col grid (`text` | `visual`), alternating sides via `.flip` (which sets
   `order:-1` on the visual). Collapses to one column < 680px. The three visuals
   are phone mockups (`.device`):
   - **Step 1 "A voice that answers"** → `.device.voice`: shows a status time,
     the **device orb** (voice-reactive), and a label that cycles
     "Listening…" ⇄ "Speaking…" on a timer while in view. When "listening" the
     device inverts to dark (`--ink` bg, orb `filter:invert(1)`).
   - **Step 2 "An evening note"** → `.device.chat` containing `#reportNote`: a
     "This evening" note with 4 bullet observations. Bullets reveal one-by-one
     when scrolled into view (`makeSeq`, ~760ms step).
   - **Step 3 "Kept true by the ones who love them"** → `.device.chat` with
     `#answerBubbles`, a scrolling chat column:
     - First a recap note (same 4 bullets), then an alternating thread.
     - **Family messages (Marie / Paul) = sender = dark bubbles, right-aligned**
       (`.bub.you`), each with a small terra name label (`.who`).
     - **Bot replies = light bubbles, left-aligned** (`.bub.them`), name label
       **"That's Right"**, *no* checkmark.
     - Messages reveal sequentially with a **randomized 1400–1600ms** gap
       (`stepMin/stepMax` in `makeSeq`) for a natural tempo; after each reveal
       the column does a **progressive scroll** (`followScroll`) that nudges the
       new item into view at the bottom while keeping earlier ones above — the
       device stays a fixed phone height and scrolls, it does NOT grow.
     - The chat column has a top/bottom mask-gradient fade (`14px`) plus
       `16px/20px` padding so the first/last items never sit under the fade.

6. **#why — Founder note** (`max-width:640px`): serif `h2` "For my father", two
   paragraphs, signed "— Dom". (An eyebrow was intentionally removed here.)

7. **#privacy** (centered): serif `h2` + one paragraph on the no-tracking stance.

8. **#gate — CTA** (`--paper-deep` bg, centered): serif `h2`, paragraph, an
   inline email form (`input` + dark `button`, button hover → terra), and
   fineprint. Form stacks vertically < 680px.

9. **footer**: copyright + Privacy / Support links, with a giant decorative
   half-orb (`<canvas id="footOrb">`) bleeding off the bottom edge
   (`transform: translate(-50%, 52%)`, non-interactive, `speed:0.5`).

---

## Interactions & Behavior

### Scroll reveal (site-wide "Framer-style" entrance)
Elements with `.reveal` start `opacity:0; transform:translateY(24px)` and
transition to visible (`.reveal.in`) over `1.1s ease` when they enter the
viewport. Driven by an `IntersectionObserver` at `threshold:0.15` that adds
`.in` (one-way — never removed).

The `#how` steps use a richer variant: the **text** slides in horizontally
(`translateX(±26px)`, `cubic-bezier(.22,1,.36,1)`, .85s) and the **visual**
rises and scales up (`translateY(38px) scale(.96)` → none, .95s, .12s delay),
both gated on the step's `.in` class.

### Orb animation (`orb.js`)
A stroked wireframe polar curve (NOT a filled sphere) rendered to `<canvas>`. It
breathes at rest and emits a soft expanding "ripple" ring. Mount via
`window.ThatsRightOrb.mount(canvasEl, opts)`:
- hero orb: `{reactivity:'proximity'}` (reacts to cursor distance)
- device orb: `{reactivity:'voice'}` + `api.setVoice(true/false)` to drive the
  listening/speaking envelope
- footer orb: `{reactivity:'off', speed:0.5}`
Honors `prefers-reduced-motion` and pauses when off-screen. See the file's header
comment for tunables. (An earlier "particle wave" was deliberately removed —
keep just the single ripple ring.)

### Sequenced demos (`makeSeq`)
Generic helper that toggles a `.seen` class on a list of elements on a timer,
loops, and resets when re-entering view. Supports a fixed `step` or a random
`stepMin..stepMax` gap, plus `lead`, `hold`, `onReset`, `onReveal` callbacks.
Each in-device demo is started/stopped by its own `IntersectionObserver`
(`threshold:0.35`).

### Voice device cycle
While in view, toggles `listening`/`speaking` on `.device.voice` (~3s / ~3.6s),
updates the label text, and calls `orb.setVoice()`.

### Reduced motion
A `@media (prefers-reduced-motion: reduce)` block disables all reveals, demo
sequences, orb CSS animations, and smooth scroll — everything renders in its
final visible state.

---

## State Management
Light, all client-side:
- **`lang`** (`"en"`/`"fr"`) and **`mode`** (`"kindness"`) — resolve copy via
  `tr(key)` with fallback chain: current-lang+mode → current-lang base →
  fallback-lang+mode → fallback base. Persisted to `localStorage`
  (`tr-lang`, `tr-mode`); falls back to `navigator.language`.
- Transient UI state: voice device `listening` boolean; demo sequence timers.

When porting to a framework, model copy as a nested i18n dictionary (see `COPY`
in the HTML) keyed by `lang → mode → key`, with `data-k` / `data-k-ph`
equivalents becoming component props or `t('key')` calls. The fallback behavior
(partial translations are safe) is worth preserving.

---

## Copy
All final copy (EN + FR, including the `kindness` tone block, device strings,
footer, and form labels) lives in the `COPY` object inside
`Thats-Right-TRV2Kind.html`. Lift it directly. Some strings contain inline HTML
(`<span class="qs">`, `<b>`, `<em>`) and are injected via `innerHTML` — preserve
that rich-text capability.

## Assets
- **`orb.js`** — the canvas orb engine. Port as-is (it's framework-agnostic;
  wrap in a component that mounts it to a ref'd `<canvas>`).
- No image files. The opening thumbnail in `<template id="__bundler_thumbnail">`
  is only used by the standalone bundler and can be ignored in production.
- Fonts: system serif/sans stacks — no web fonts to load. If the brand later
  wants a specific serif, swap the `--serif` stack.

## Files
- `Thats-Right-TRV2Kind.html` — the complete prototype (markup, all CSS, copy
  dictionary, and behavior scripts).
- `orb.js` — the orb animation engine, loaded by the HTML.
