---
name: recorder
description: Records polished demo videos of a ToolJet feature from a running local instance. Each video gets a ToolJet logo intro and outro, a local Kokoro voiceover with subtitles that match it word for word, a visible pointer, zoom, spotlight and hand-drawn circle emphasis, waits hidden behind crossfades, and chapters, sized to fit GitHub's attachment limit. Use when asked to record, re-record, screen-record or polish a demo, walkthrough or PR video for an issue, PR or feature, to build a feature overview reel, when a plan's Evidence decision asks for video, or to post demo videos to GitHub.
---

# Recorder

You write one Playwright script per journey and run it twice: once dry, once for real. The scripts in `scripts/` handle capture, cuts, voice, subtitles, pointer, emphasis, intro and outro, and encoding. Proven end to end: 8 case videos (50–68 s, 4–6 MB each) plus a 3-minute overview (8.3 MB).

Settle every polish choice in one brief first: changing one after the first render means re-rendering every video.

## 1. Brief: ask once, before recording

Send one message with these defaults; the user changes any line:

- **Videos:** one overview (2–3 min, a chapter per case) plus one per case journey (about 60 s or less).
- **Branding:** ToolJet logo intro (~2.3 s, title + one-line subtitle) and outro (~1.7 s) on navy, from `frontend/assets/images/logo-dark.svg`.
- **Voice:** Kokoro `af_heart`, speed 1.1, one short sentence per beat.
- **Subtitles:** the exact narration, timed to each clip; lines over 11 words split at a pause. Soft SRT track too.
- **Pointer:** argo human cursor with click highlight; every click and type goes through it.
- **Emphasis:** zoom + spotlight for small text and numbers; at most one hand-drawn circle per scene for the key moment; pointer alone otherwise. Effects linger 1.5 s after the line.
- **Cuts:** 0.6 s crossfades, no jump cuts. Waits (reloads, seeding, slow calls) happen off camera. Typing is real time, never sped up.
- **Setup:** signed in beforehand and deep-linked to the screen; no login or navigation on camera.
- **Output:** 1440×900 H.264, 9 MB or less each (GitHub's attachment limit is 10 MB), chapters per case.
- **Data:** demo users only; the baseline is restored after every take.

## 2. Prerequisites

| Need | Check | Install |
|---|---|---|
| ffmpeg + ffprobe on `PATH` | `ffmpeg -hide_banner -filters \| grep -E ' (xfade\|loudnorm) '` | `brew install ffmpeg` |
| Playwright + Chromium | `npx playwright --version` | `npx playwright install chromium` |
| argo (cursor only) | `npx argo doctor` | in `package.json` |
| Kokoro voice (local, no key, ~400 MB) | `node tts.mjs "test"` | in `package.json` |
| Running instance | `tools/tj/bin/tj status --json` | `tools/tj/bin/tj start --json` |
| Demo users + password | sign-in works | seed them; `DEMO_PASSWORD` env, never in a file |
| macOS (secret check only) | `swiftc --version` | Xcode command line tools |

Set up a scratch workspace, never in the repo:

```bash
W=<scratchpad>/demos; mkdir -p $W && cp -R .agents/skills/recorder/scripts/. $W/ && cd $W
npm i
export TJ_LOGO=<repo>/frontend/assets/images/logo-dark.svg BASE=http://localhost:<frontend-port> DEMO_PASSWORD=...
```

The scripts resolve modules from their own folder, so they must run from the workspace copy.

## 3. Before recording

1. **Plan the journeys.** Group cases into journey videos. For each beat write one narration sentence; subtitles are the narration, word for word. Don't narrate numbers that a pending fix will change.
2. **Snapshot state.** `pg_dump -Fc` the demo DB to the scratchpad before touching anything; credentials come from the env files and are never printed. Then snapshot the tables you will mutate into a `demo_base` schema. Each script's `reset()` restores them at start, after each scene that changes state, and on error.
3. **Accounts.** `auth.cjs` signs each user in through the UI once and saves a storageState to `auth/`. For API setup, sign in with `POST /api/authenticate/:workspaceId`; on multi-workspace instances the bare `/authenticate` gives a session other workspaces reject.

## 4. Write a journey

Start from `journey-template.cjs`. The `Rec` API (`recorder.cjs`):

- `r.intro(ctx, title, subtitle)` / `r.outro(ctx, title?, subtitle?)`: branded card, crossfaded. Outro defaults come from `DEMO_OUTRO_TITLE` and `DEMO_OUTRO_SUB`.
- `r.line(narration, async () => {...})`: one beat. Voice and subtitle start after any crossfade; the action runs while the voice plays; the line holds until the voice ends. A zoom, spotlight or circle made in the beat lingers 1.5 s, then eases out.
- **Emphasis:** `r.zoom(locatorOrBox, 1.3–2)` smooth CSS zoom for small text; `r.mark(loc)` spotlight; `r.mark(loc, 'circle')` hand-drawn circle. A circle on a full-width element is huge, so spotlight those instead.
- **Pointer:** `r.point(loc)` glides to the target; `r.click(loc)`; `r.type(loc, text)` clicks the field then types; `r.clickXY(loc)` for elements that never pass Playwright's stability check (some dropdowns).
- **Cuts:** `r.cut(fn)` hides waits, reloads and SQL changes behind a crossfade. `r.pause()` → `r.attach(otherPage)` → `r.resume()` switches pages or users. Pre-load every page before recording starts, so no load or blank flash is captured.
- `r.chapter('C01 …')`: one chapter per case, in the MP4 metadata. `r.hold(ms)`, `r.scrollTo(loc)` as needed.

Output goes to `$DEMO_OUT` (default `./out`).

## 5. Run

```bash
DRY=1 node journey.cjs && ./montage.sh out/dry-<name> out/m.png 4   # one frame per beat; look at it
node journey.cjs                                                   # out/<name>.mp4 + .srt + .chapters.txt
./review.sh out/<name>.mp4 out/r.png 2                             # tile every 2 s; check cuts and polish
```

- **Final encode:** H.264 1440×900, AAC 96k normalised to −16 LUFS, mov_text subtitles and chapters. CRF steps up until the file is 9 MB or less; still over → split the video.
- Record one video, show it to the user, then record the rest. Whenever the instance code changes, re-run the dry pass first.

**Overview video**, recorded last from the case videos:

1. `node cards.cjs cards.json` renders the logo intro, problem slides and closing summary, all narrated.
2. `node assemble-overview.cjs plan.json` cuts clips from the case videos by subtitle cue range, adds a lower-third per section, joins them with crossfades, and shifts the SRT and chapters to match.

## 6. Check, post, restore

1. **Secret check:** `./secret-check.sh out/*.mp4` takes one frame every 2 s, runs on-device OCR, and greps for keys, tokens and licence text. Menu labels like "LLM key" are expected; look at every other hit. Also look for `.env` contents, terminals, devtools, real names or emails. Re-record any video that shows one.
2. **Listen check:** `node asr.mjs out/V1.mp4` (local Whisper, 25 s windows); compare with the `.srt`.
3. **Post, only when asked** (gh ≥ 2.102):
   ```bash
   gh issue comment <n> --body-file comment.md --attach ./V0.mp4 --attach ./V1.mp4 …
   gh pr edit <n> --body-file body.md --attach ./V1.mp4    # PR: under the Demo / Evidence section
   ```
   gh appends the uploaded URLs at the end of the body; it does not replace bare `./V1.mp4` lines. Reference each file as `![V1](./V1.mp4)` so it renders as a player in place, or edit the body after posting to move the URLs. Issue comment: overview first, then each case with a title and one line on what it shows. If the call times out, list the comments before retrying, because the upload may have landed.
4. **Restore:** `pg_restore --clean` the dump; drop the snapshot schema and any cloned DBs; put back every env file you edited; delete `auth/` (session cookies); confirm the instance looks as it did before.

## Gotchas

- **argo can't pause mid-recording,** so don't use `argo pipeline`; use argo only for `createHumanCursor` and `cursorHighlight`. Its post-export `zoomTo` would also scale the burned-in subtitles, so zoom in the browser instead. Overlays live on `<html>`, outside the zoomed `<body>`.
- **Never speed-ramp while the voice plays.** Narration is placed on the output clock, so a 2× span throws it out of sync.
- **Playwright `hover()` moves the raw mouse,** so the pointer jumps. Use `r.point`.
- **CodeMirror inputs** (such as chat or code editors): click, then `keyboard.insertText` one character at a time. `pressSequentially` loses characters and Enter can trigger autocomplete.
- **Real LLM beats:** keep prompts tiny, pause the recording while waiting, wait until the run has finished before the next scene, and clear the app's earlier conversations first so old chats don't show.
- **Faking state by SQL:** change every field the UI derives from (totals and the pool behind them, expiry dates), not only the visible number.
- **Edition mismatch:** a demo DB from another edition may refuse to start; clone it and adjust the clone, never the original.
- **Length budget:** each emphasised beat costs about the voice length plus 2.2 s. Merge beats or drop emphasis to stay near 60 s.

## Rules

- Never record production or real customer data.
- No secrets on screen, in narration or in file names.
- Never narrate numbers that may change before release.
