# Handoff: Guide & FAQ — content came from the wrong source

**Date:** 2026-07-13
**Branch:** `feat/guide-faq-spec` (local only, NOT pushed, NOT deployed)
**Status:** Infrastructure DONE and verified. **Content accuracy is SUSPECT — do not trust the install steps until re-derived from the authoritative source.**

---

## The problem Dominique caught (this is the whole reason for the handoff)

The guide *builds and works*, but the **install-step content does not match the latest app builds**. The step order is off, and more importantly the content was **synthesized from a source that wasn't the authoritative one**. The ordering is a symptom; the root issue is provenance.

**Do NOT just reorder the steps.** First establish what the *real, shipped* onboarding flow is, then reconcile the guide against it. Treat every current step's order, wording, and screen description as an unverified claim.

Relevant skill for next session: **`falsifying-inherited-premises`** — the guide content rests on an inherited flow-map that turned out wrong. Re-derive from ground truth; don't patch the inherited version.

---

## How the bad content got in (so you can find the real source)

Phase-1 planning used an `Explore` subagent that read the **Rmb repo** (`~/Documents/Rmb`) and produced a "26 internal screens → 7 caregiver steps" flow map. That map drove the seed content in `guide-src/src/content/steps/*.json`. The agent read a MIX of:

- `Rmb/README.md` — **snapshot dated 2026-06-18** (likely behind the latest build)
- `Rmb/Onboarding/**` Swift code
- design **specs** in `Rmb/docs/superpowers/specs/` — these are **design intent, not necessarily what shipped**

### Leading hypotheses for "wrong source" (investigate each)
1. **Specs ≠ shipped.** The agent may have described the flow as *specced/aspirational* rather than as *built*. Design docs describe intent; the app may differ.
2. **Stale checkout / worktree.** `~/Documents/Rmb` has MANY worktrees (`.worktrees/*`, `.claude/worktrees/*`) on different branches. If any read picked up a worktree or an old branch, the flow could be outdated. Confirm which checkout reflects the current TestFlight build.
3. **README snapshot lag.** The 2026-06-18 README predates later onboarding changes (e.g. specs dated 2026-07-06/07/09/11 touch onboarding categories, voice onboarding, streaming). The step order/structure may have moved since.
4. **Interview structure.** The guide compresses an 11-category interview into one "interview" step; the real latest flow may structure or order categories differently, or interleave permissions/SIWA differently.

### What is the AUTHORITATIVE source of truth for the shipped flow?
Pick and verify against ONE of these, in order of trust:
1. **The actual latest TestFlight build** — run it on a device/sim and record the real screen order (this is ground truth; per `verifying-on-the-real-surface`).
2. **The onboarding state machine in code at the shipped commit** — `Rmb/Onboarding/OnboardingChatState.swift`, `OnboardingCategory.swift`, the phase enum, the permissions view, the Telegram handoff view — read at the commit that produced the current build, not a worktree.
3. **Dominique** — he knows the real current flow; a 2-minute confirmation of the true step order beats re-deriving it.

One thing WAS confirmed with Dominique this session: the Telegram step uses the **concierge auto-create + caregiver-joins** flow (not the older "caregiver creates the group"). Keep that unless the build says otherwise.

---

## What IS solid (don't rebuild this — it's infrastructure, verified)

The whole build/render/search system is sound and reviewed. Only the *words and their order* are in question — and fixing those is a **low-risk data edit** (edit JSON, rebuild), no code changes.

- Astro build-time toolchain in `guide-src/`, output committed to repo-root `guide/`, `fr/guide/`, `_astro/`. Vercel still zero-build; existing site verified untouched across the whole branch.
- Bilingual content schema with build-time validation (missing FR or dangling FAQ link fails the build).
- Illustrated phone renderer (voice/chat/permission/qr/two-phone), per-step pages with chevron nav, typo-tolerant client FAQ search, EN + FR.
- 18 tests pass. Final whole-branch review passed after fixing a CRITICAL bug (the `_astro/` CSS/JS bundle wasn't being copied to the served tree — now fixed and verified: assets serve 200).

### How to fix content once the real flow is known
1. Edit the relevant `guide-src/src/content/steps/*.json` (order field, actions, youShouldSee, illustration) and/or `faqs/*.json`. Each file is bilingual `{en,fr}`.
2. `npm --prefix guide-src run build` (regenerates `guide/`, `fr/guide/`, `_astro/`; fails loudly on missing FR or dangling snag `faqRef`).
3. `npm --prefix guide-src test` (18 tests).
4. Commit source + regenerated output together.
5. Authoring notes: `guide-src/README.md`.

Full plan: `docs/superpowers/plans/2026-07-13-guide-and-faq-phase1.md`. Spec: `docs/superpowers/specs/2026-07-13-guide-and-faq-design.md`. Per-task progress + all findings: `.superpowers/sdd/progress.md` (git-ignored, local).

---

## Deferred cosmetic minors (from reviews; optional, non-blocking)
- `guide-src/scripts/validate.mjs` — non-recursive dir scan while loader is `**/*.json` (fine while content is flat).
- `GuideLayout.astro` — `aria-current="false"` on inactive lang link (idiomatic form omits it).
- Brand apostrophe: guide uses ASCII `That's Right`; existing site uses typographic `That's`. Consider aligning.
- FAQ `<title>` EN/FR word order differs (acceptable natural FR order).
- Comments in `place.mjs` / `.gitignore`.

---

## Integration state / what NOT to do
- **NOT public.** Do not merge to `main` (main = auto-deploy to prod). Do not deploy. Dominique will decide when.
- Branch is **local, not pushed.** Held off pushing because the Vercel-connected repo may spin up a preview deployment on branch push — flagged to Dominique; push only on his go.
- No homepage link to `/guide` yet (would touch `index.html`, deferred to explicit approval).
- Phase 2 (the release-triggered auto-update pipeline in the Rmb repo) is NOT started — that's a separate spec/plan cycle after content is correct.
