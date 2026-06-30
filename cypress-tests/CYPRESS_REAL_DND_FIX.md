# Required fix in `cypress-real-dnd`

This documents a bug in the [`cypress-real-dnd`](https://github.com/emidhun/cypress-real-dnd)
plugin (v0.1.2) that ToolJet's `dragAndDropWidget` command currently works
around with a band-aid. Fixing the plugin lets us delete that workaround.

- **Plugin source (local checkout):** `/Users/midhunkumare/toolJetSpace/cypress-real-dnd/`
- **Installed copy:** `cypress-tests/node_modules/cypress-real-dnd/src/plugin.js`
- **Workaround to remove after the fix:** the `cy.on('fail')` trap
  (`installFailTrap` / `currentTrap` / `onFail`) in
  `cypress-tests/cypress/commands/commands.js` → `dragAndDropWidget`. A
  ready-to-paste simplified command is in the `REUSE-AFTER-PLUGIN-FIX` comment
  block directly below that command.

---

## Symptom

On the **first drag of a spec run**, and again on the **first drag after every
AUT navigation** (each `apiCreateApp` + `openApp` in a `beforeEach`), the drag
task rejects:

```
[cypress-real-dnd] No Input.dragIntercepted event after the mouse-move past threshold.
The source element may not be a real HTML5 draggable ...
```

A rejected `cy.task` is an un-catchable command-queue failure, so it kills the
`beforeEach` and the whole spec — it is NOT the silent-miss that a normal
count/retry can recover from.

## Root cause

The CDP intercept (`Input.setInterceptDrags`) gets silently disarmed by the AUT
navigation, and **the plugin cannot re-arm it**:

1. **`getClient()` caches everything in `cdpPromise`** (`src/plugin.js:106`):
   ```js
   if (cdpPromise) return cdpPromise;
   ```
   The CDP attach **and** the mouse-cycle warmup **and** the
   `Input.setInterceptDrags({enabled:true})` re-arm all live *inside* that
   cached promise (≈ `plugin.js:116–183`). So they run **exactly once per spec
   run** — the first time `getClient()` is awaited — and never again.

2. **`realDragInit()` is a no-op on a warm client** (`src/plugin.js:~340`):
   ```js
   async function realDragInit() {
     await getClient();   // returns the cached promise → no re-arm, no warmup
     await sleep(1500);
   }
   ```
   ToolJet calls `cy.realDragInit()` before every drag *expecting* it to
   re-arm; on a warm client it just sleeps.

3. **`realDrag`'s internal auto-retry is too small** (`src/plugin.js:~301–316`):
   one retry with a ~300 ms settle — not enough budget for a freshly-navigated
   AUT whose CDP traffic is still settling.

Net: after a navigation the renderer's intercept is gone, `realDragInit()`
can't bring it back, and the next drag throws.

## The fix (preferred): make arm + warmup re-runnable, decoupled from the connection cache

Split `getClient()` into **attach-once** vs **arm-and-warmup (re-runnable)**,
and have `realDragInit()` always run the latter against the existing client.

```js
// attach the CDP client once (cache the CONNECTION only)
async function getClient() {
  if (cdpPromise) return cdpPromise;
  cdpPromise = (async () => {
    const { Input, Runtime /* ... */ } = await attachToAutTarget();
    Input.dragIntercepted(({ data }) => { lastDragData = data; });
    return { Input, Runtime /* ... */ };
  })();
  return cdpPromise;
}

// re-runnable: arm interceptDrags + burn the cold window. Safe to call any time.
async function armAndWarmup() {
  const { Input } = await getClient();
  await Input.setInterceptDrags({ enabled: true });
  await sleep(300);
  // off-canvas no-op mouse cycle (the existing warmup body), then re-arm:
  await Input.dispatchMouseEvent({ type: "mousePressed",  x: 1, y: 1, button: "left", clickCount: 1 });
  await Input.dispatchMouseEvent({ type: "mouseMoved",    x: 6, y: 6, button: "left" });
  await Input.dispatchMouseEvent({ type: "mouseReleased", x: 6, y: 6, button: "left" });
  await Input.setInterceptDrags({ enabled: true });
  await sleep(200);
  return { ok: true };
}

async function realDragInit() {   // now genuinely re-arms per call
  await armAndWarmup();
  return { ok: true };
}

// realDrag should also armAndWarmup() on its catch/retry path instead of just
// re-calling setInterceptDrags once.
```

Register the task as today (`cdpRealDragInit: realDragInit`). No API change —
ToolJet's existing `cy.realDragInit()` calls start doing what they always
assumed.

### Smaller alternatives (if you'd rather not refactor)
- **Bump the internal retry budget** in `realDrag` (`~plugin.js:301–316`): retry
  2–3× with a longer settle (~800 ms) and call the warmup before each retry.
- **Add a dedicated re-warm task**, e.g. `cdpRealDragRewarm` → `armAndWarmup()`,
  and call `cy.realDragRewarm()` before each drag instead of `realDragInit()`.

## Verify after the fix
1. In the plugin repo: bump version (e.g. `0.1.3`), `npm publish` (or `npm pack`
   + install locally).
2. In `cypress-tests`: bump `cypress-real-dnd` in `package.json`, `npm install`.
3. Replace `dragAndDropWidget` with the simplified body from the
   `REUSE-AFTER-PLUGIN-FIX` comment in `commands.js` (drop the `cy.on('fail')`
   trap entirely).
4. Run — all should stay green with NO fail-trap and NO throws:
   ```
   cd cypress-tests
   npx cypress run --browser chrome --headless \
     --spec "cypress/e2e/happyPath/appbuilder/commonTestcases/components/buttonHappyPath.cy.js" \
     --config baseUrl=http://localhost:8082
   # repeat for datePickerHappyPath.cy.js and newSuits/componentsBasics/button.cy.js
   ```
5. Bonus: the suite-wide **CSA** tests (quarantined as "post-popover drag
   No dragIntercepted" across number/password/text/modal/csa specs) are blocked
   by the same root cause — re-check and un-skip them once the plugin is fixed.

## Why we shipped the band-aid instead of editing the plugin here
`node_modules` edits aren't committable and are lost on `npm ci`, so the
test-side `cy.on('fail')` trap in `commands.js` is the committable stopgap. It
recovers the throw correctly (re-arm + re-drive, re-throwing anything that
isn't the cold-intercept error), but the clean home for the fix is the plugin.
