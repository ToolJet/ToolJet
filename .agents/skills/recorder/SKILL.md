---
name: recorder
description: >-
  Records polished demo videos of a running ToolJet instance: one overview plus one short video
  per case, with a ToolJet logo intro/outro, local voiceover, subtitles, a visible pointer,
  emphasis (zoom, spotlight, hand-drawn circle) and crossfades, sized for GitHub. Use when asked
  to record, demo, screen-record, or make a walkthrough, demo or PR video, or when a plan's
  Evidence decision asks for video.
---

# Recorder

Scripted Playwright walkthroughs → small MP4s that play inline on GitHub. Settle every polish choice in one brief: changing one after the first render means re-rendering every video.

## 1. Prerequisites

Work in `<scratchpad>/demos/` with its own `package.json`; install nothing into the repo. Copy `scripts/*` from this skill into `<scratchpad>/demos/lib/`.

| Need | Check | Install |
|---|---|---|
| ffmpeg + ffprobe on `PATH` | `ffmpeg -hide_banner -filters \| grep -E ' (xfade\|loudnorm) '` | `brew install ffmpeg` |
| Playwright + Chromium | `npx playwright --version` | `npm i playwright && npx playwright install chromium` |
| argo (human cursor, click highlight) | `npx argo doctor` | `npm i @argo-video/cli` |
| Kokoro voice (local, no key, ~400 MB) | `node lib/tts.mjs "test"` | `npm i kokoro-js` |
| Running instance | `tools/tj/bin/tj status --json` | `tools/tj/bin/tj start --json` |
| Demo users + password | sign-in works | seed them; `DEMO_PASSWORD` env, never in a file |

Not `argo pipeline`: it records one uncut take (no pausing for seeding or reloads), and Homebrew's ffmpeg lacks libass for burned subtitles. `rec.cjs` records CDP screencast segments, crossfades between them and draws subtitles in the page; argo supplies only the cursor.

## 2. Brief: ask once, before recording

One message with these defaults; the user changes any line:

- **Videos:** one overview (2–3 min, a chapter per case) + one per case (≤ 60 s).
- **Branding:** ToolJet logo intro (~2 s, title + subtitle) and outro (~1.5 s), from `frontend/assets/images/logo-dark.svg`.
- **Voice:** Kokoro `af_heart`, speed 1.1, one short sentence per beat.
- **Subtitles:** the exact narration, timed to each clip; lines over 11 words split at a pause. Soft SRT track too.
- **Pointer:** argo `createHumanCursor` + `cursorHighlight({ mode: 'click' })`; every click and type goes through it.
- **Emphasis:** zoom + spotlight for small text and numbers; one hand-drawn circle per scene for the key moment; pointer alone otherwise. Effects linger 1.5 s after the line.
- **Cuts:** 0.6 s crossfades, no jump cuts. Waits (reloads, seeding, slow calls) happen off camera. Typing is real-time, never sped up.
- **Setup:** signed in beforehand (`storageState`) and deep-linked to the screen; no login or navigation on camera.
- **Output:** 1440×900 H.264, ≤ 9 MB each (GitHub attach limit 10 MB), chapters per case.
- **Data:** demo users only; the baseline is restored after every take.

## 3. Script each video

One `.cjs` per video:

```js
const { ctxFor, BASE, close } = require('./lib/auth.cjs');
const { Rec } = require('./lib/rec.cjs');
const L = { open: 'Admins see every builder and what they used this month.', sort: 'Sort by most used to find the top spenders.' };
(async () => {
  restoreBaseline();                                   // your seed/reset, off camera
  const r = new Rec('01-usage-table');
  await r.prewarm(Object.values(L));                   // voice generated before recording
  const c = await ctxFor('admin@example.com'); const p = await c.newPage();
  await p.goto(BASE + '/settings/...'); await p.getByRole('table').waitFor();
  await r.intro(c, 'Admins see who used what', 'Feature · Case 1');
  await r.attach(p); await r.resume();
  r.chapter('Case 1 Usage table');
  await r.line(L.open, () => r.point(p.getByRole('heading').first()));
  await r.line(L.sort, async () => { await r.click(p.getByRole('button', { name: 'Sort' })); await r.mark(p.getByRole('row').nth(1), 'circle'); });
  await r.cut(async () => { /* reload or reseed */ });  // off camera, crossfade back in
  await r.outro(c, 'Feature name', 'ToolJet');
  console.log(await r.stop());                         // encodes; returns { final, duration, size }
  restoreBaseline(); await close();
})();
```

API: `line(narration, fn)` (subtitle = narration), `point`, `click`, `type`, `scrollTo`, `zoom(locator, scale)`, `mark(locator, 'spot' | 'circle')`, `cut(fn)`, `chapter(name)`, `hold(ms)`. Output goes to `$REC_OUT` (default `./out`).

Record one video, show it to the user, then record the rest. The overview is recorded last, from the same scripts' beats.

## 4. Check before sharing

- **Contact sheet:** `ffmpeg -i v.mp4 -vf "fps=1/2,scale=576:360,tile=4x6" -frames:v 1 sheet.png`; look for blank frames, stray cursor, subtitle overlap.
- **Secrets, frame by frame:** tokens, `.env` contents, terminals, devtools, real names or emails. Re-record any video that shows one.
- **Size:** `rec.cjs` raises CRF until ≤ `REC_MAX_MB`; still over → split the video.
- **Baseline:** restored; demo data gone from shared instances.

## 5. Share

- PR: `gh pr edit <n> --body-file body.md --attach v.mp4` (gh ≥ 2.102) under *How to test → Evidence*.
- Issue: one comment, overview first, then each case: title, one line of what it shows.
- Delete `auth/*.json` (session cookies) afterwards.

## Rules

- Never record production or real customer data.
- No secrets on screen, in narration or in file names.
- Never narrate numbers that may change before release.
