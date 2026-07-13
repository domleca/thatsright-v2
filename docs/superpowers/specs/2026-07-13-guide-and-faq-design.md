# Design: Dynamic illustrated Guide & FAQ

**Date:** 2026-07-13
**Status:** Approved (brainstorming), pending implementation plan
**Repos touched:** `thatsright-v2` (website), `Rmb` (app — pipeline only)

---

## 1. Purpose

Build a **Guide / How-to** section on thatsright.xyz that:

- **a)** walks a **caregiver** through installing and setting up That's Right on
  **their parent's phone**, step by step, with illustrated phone mockups;
- **b)** provides an **always-up-to-date FAQ** with fast, typo-tolerant search.

The section must **update itself after each release** — a pipeline reads the
changelog (merged PRs since the last release), drafts updates to the guide and
FAQ, opens a pull request for **Dominique's review**, and publishes on merge.

**Audience:** elderly users and their caregivers. Onboarding must be
frictionless; any install snag should be resolvable from this online guide
alone. Copy follows the `thatsright-product-voice` skill.

---

## 2. Decisions locked during brainstorming

| Question | Decision |
|---|---|
| Install path | **TestFlight now, App Store later.** Install section structured so it can be swapped when the app ships publicly. |
| Who installs | **Caregiver sets up the parent's phone.** Copy speaks to the caregiver; steps happen on the parent's device (except the QR handoff, which uses both phones). |
| Review flow | **GitHub PR + Vercel preview link.** Pipeline opens a PR; Vercel builds a preview; Dominique reads the plain-language summary, clicks the preview, merges to publish. |
| Trigger | **Release tag** (TestFlight release; later, App Store production submission). Batches all PRs merged since the previous release. Not per-PR (too noisy), not manual (defeats the purpose). |
| Tech approach | **Astro, scoped to the guide only.** New `/guide` + `/fr/guide` built in Astro with schema-validated content. All existing pages (homepage, privacy, apply, thanks) served exactly as today, untouched. |

### Why Astro, scoped
Astro validates every content file against a defined shape **at build time**.
An automated edit that drops a translation or points a snag-link at a
nonexistent FAQ entry turns the PR build **red before Dominique reviews it**.
That build-time guarantee is the durability the pipeline needs. Scoping it to
the guide avoids risky surgery on the finely-tuned existing pages for no visible
gain.

---

## 3. Guide UX (design locked visually)

### Step layout
Each step is one screen:

- **Quiet step label** — plain text "Step 7 of 8" (no stepper dots).
- **Serif title** (matches site `--serif`, weight 400).
- **Numbered action list** — short, one action per line, numbers in
  **terracotta (`--terra`), no circles**. Each action is a single thing to do.
- **"You should see" box** — `--bubble-them` fill, `--line-faint` border,
  terracotta label in **sentence case** (not caps). Describes the expected
  on-screen result so the caregiver can self-confirm.
- **Snag line** — "Nothing happened when you scanned? See '…'" linking to the
  relevant FAQ entry. **Left-aligned with the text inside the "You should see"
  box** so the block reads as one column.
- **Navigation** — **chevrons left/right of the main view**, each with a small
  subtle label naming the adjacent step. No large Prev/Next buttons.

### Illustrations
Phone mockups are **stylized reconstructions, not screenshots** — built from the
site's existing `.device` / `.device.chat` / `.device.voice` / `.msg` / `.bub`
primitives, so they match the homepage and never drift from a real screenshot as
the app changes. They render **from the content files** (see §4): change the
bubble text in the file, the drawn phone updates.

- **Single phone is the default** — most steps show one phone (the parent's).
- **Two phones only when a step genuinely needs both** (the QR → Telegram
  handoff at step 7). When two are shown, **both devices are the same height**;
  content scales inside.

### FAQ
- **Search box** — large, prominent, typo-tolerant.
- **Category chips** — All / Installing / The interview / The family group /
  Daily use / Privacy.
- **Q&A list** — questions phrased the way a caregiver actually asks
  ("I don't have Telegram. Do I need it?"); tap to expand the answer.
- Search index is **baked at build time**; matching happens **client-side**
  (instant, no server).

---

## 4. Content model (what makes it updatable)

Every step and every FAQ entry is a **structured content file** in the website
repo (Astro content collection), not prose embedded in a page.

### Step entry fields
- `order` — position in the sequence
- `title` — { en, fr }
- `actions` — ordered list of { en, fr } strings
- `youShouldSee` — { en, fr }
- `snag` — optional { text: {en, fr}, faqRef: <faq-id> }
- `illustration` — structured description the renderer turns into drawn phones:
  which device type(s), bubble text, QR vs. permission-popup vs. voice orb, etc.

### FAQ entry fields
- `id` — stable slug (snag links point here)
- `question` — { en, fr }
- `answer` — { en, fr }
- `category` — one of the fixed set
- `keywords` — extra search terms { en, fr }

### Three load-bearing properties
1. **EN and FR live in the same file.** The pipeline cannot update English and
   forget French — a missing FR field **fails the build**.
2. **Astro schema validation at build time.** Malformed content (missing
   translation, `faqRef` pointing at a nonexistent entry, bad `illustration`
   shape) turns the PR build red **before human review**.
3. **Illustrations render from these files** — no image assets to hand-edit,
   ever.

---

## 5. Self-updating pipeline

Lives in the **Rmb repo** as a GitHub Action.

1. **Trigger** — a release tag is pushed (later: App Store production
   submission).
2. **Collect** — gather every PR merged since the previous release: titles,
   descriptions, labels.
3. **Draft** — a Claude step reads that digest **plus the current guide/FAQ
   content** and answers one question: *does anything users see, do, or get
   stuck on change?*
   - **Yes** → it edits the content files, following the
     `thatsright-product-voice` skill and copy rules (no em dashes; French
     spacing before `? ! : ;`; caregiver tone).
   - **No** (e.g. pure backend release) → it **opens nothing**, logs
     "no user-facing changes." No noise.
4. **Submit** — opens a PR on the **website** repo. PR description is a
   plain-language summary of what changed and why, EN + FR.
5. **Review & publish** — Vercel builds a preview automatically. Dominique reads
   the summary, clicks the preview, merges to publish. Schema check has already
   run; a red ❌ means don't bother reading.

### Honest limitation
The draft is only as good as the PR descriptions it reads. Empty or cryptic PR
descriptions produce weak drafts. Rmb PRs are well-written today, so this works
— but **PR-description quality is the lever** on output quality.

---

## 6. Build order (two implementation plans)

- **Phase 1 — the guide itself.** Hand-written seed content (drafted from the
  Rmb README + `Rmb/Onboarding` code, reviewed by Dominique), the Astro
  `/guide` + `/fr/guide` pages, illustrated step renderer, client-side FAQ
  search. **Ships and is useful on its own**, with no automation.
- **Phase 2 — the pipeline.** The GitHub Action in Rmb that drafts updates and
  opens PRs. Built only after Phase 1 content shape is proven in production.

Each phase gets its own spec → plan → implementation cycle. This document
covers the overall design; Phase 1 is the immediate next planning target.

---

## 7. Out of scope (YAGNI)

- No CMS / admin UI. Content is files in git; review is the PR.
- No server-side search. Client-side index only.
- No rewrite of existing pages. Astro is added alongside, guide-only.
- No approval mechanism beyond GitHub PR + Vercel preview (no email/Telegram
  approve-links).
- No per-PR triggering. Release-tag batching only.
