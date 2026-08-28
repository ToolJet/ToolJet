/**
 * switchPage / cleanUpStore contract tests.
 *
 * A page switch is the single most destructive operation in the App Builder:
 * one call tears down the dependency graph, the resolved store, the exposed
 * values, the undo stack and the layout overrides, then rebuilds all of it for
 * a different page. Every fact below is something a widget, a CSA or a query
 * silently depends on.
 *
 * NO MOCKS of App Builder code. The real composed store is driven directly;
 * only `react-hot-toast` is stubbed, because it is the external boundary the
 * re-entrancy guard reports through and there is no other way to observe that
 * the guard fired rather than silently no-oped.
 *
 * DRIVING switchPage — read before editing:
 *   switchPage is fire-and-forget: it kicks off `doSwitch().catch(...)`
 *   (appSlice.js:357) and returns undefined immediately. `doSwitch` contains TWO
 *   `await yieldToMain()` hops (appSlice.js:291 and :351). yieldToMain
 *   (batchManager.ts:129-132) falls back to `setTimeout(resolve, 0)` because jsdom
 *   has no `scheduler.yield`, so these are MACROTASKS: `await Promise.resolve()`
 *   will NOT advance them. Every test drives the switch with `settle()` below —
 *   real `setTimeout(0)` hops under real timers, or
 *   `jest.advanceTimersByTimeAsync(0)` under fake ones.
 *
 *   One hop is enough to reach the middle of doSwitch (past cleanUpStore, past
 *   setCurrentPageId); the switch is only fully finished after the second hop.
 *   settle() takes three to leave headroom, and every test MUST call it before
 *   finishing — a doSwitch continuation left pending would fire during the next
 *   test and wipe that test's store.
 *
 * BATCH LEAK — also read before editing:
 *   switchPage ends by OPENING an exposed-value batch (appSlice.js:353) that
 *   nothing on the happy path closes; `_depth` is closure state in
 *   createResolvedSlice that the zustand reset in __mocks__/zustand.js cannot
 *   touch. The afterEach below drains it. Without that drain every test after
 *   the first would see an already-open bracket.
 */
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition, binding } from '@/test/app-builder';

// The only mock in this file, and only because the guard's rejection is
// otherwise unobservable. Everything App Builder-side stays real.
jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.loading = jest.fn();
  toast.dismiss = jest.fn();
  toast.custom = jest.fn();
  return { __esModule: true, default: toast, toast };
});
import toast from 'react-hot-toast';

const state = () => useStore.getState();

const PAGES = () => [
  {
    id: 'page-a',
    handle: 'a',
    name: 'A',
    components: { c1: componentDefinition('c1', 'textinput1', 'TextInput') },
  },
  {
    id: 'page-b',
    handle: 'b',
    name: 'B',
    components: { c2: componentDefinition('c2', 'text1', 'Text', { text: binding('hello') }) },
  },
];

/**
 * Brings one module of the real store up to the state useAppData leaves it in
 * after an app load: two pages, page-a current, name->id mapping built, live
 * dependency graph, an app record (switchPage reads slug/appId off it to build
 * the URL it navigates to).
 *
 * Ordering is load-bearing — see the block comment in src/test/app-builder/seed.js.
 * seedApp() itself is not reusable here because it seeds exactly one page and a
 * page switch needs somewhere to switch TO.
 */
function seedModule(moduleId = 'canvas') {
  const s = useStore.getState();
  if (moduleId !== 'canvas') {
    // 'canvas' is the only module present in every slice's initialState.
    s.initializeAppSlice(moduleId);
    s.initializeModeSlice(moduleId);
    s.initializeComponentsSlice(moduleId);
    s.initializeResolvedSlice(moduleId);
    s.initializeDataQuerySlice(moduleId);
  }
  s.initializeDependencySlice(moduleId);
  s.setPages(PAGES(), moduleId);
  s.setCurrentPageId('page-a', moduleId);
  s.setComponentNameIdMapping(moduleId);
  s.initDependencyGraph(moduleId);
  s.setApp({ appId: `app-${moduleId}`, appName: 'Test app', homePageId: 'page-a', slug: `slug-${moduleId}` }, moduleId);
}

/** One macrotask hop — resolves exactly one `await yieldToMain()`. */
const hop = ({ fakeTimers = false } = {}) =>
  fakeTimers ? jest.advanceTimersByTimeAsync(0) : new Promise((resolve) => setTimeout(resolve, 0));

/** Drive doSwitch's two macrotask hops to completion. See the header. */
async function settle(options) {
  for (let i = 0; i < 3; i++) await hop(options);
}

afterEach(() => {
  // Mandatory: reclaim the bracket switchPage opened and never closed.
  while (state().isExposedValueBatching()) state().flushExposedValueBatch();
});

describe('switchPage — what a completed switch guarantees', () => {
  test('the new page becomes current and its components get resolved', async () => {
    seedModule();

    state().switchPage('page-b', 'b');
    await settle();

    expect(state().getCurrentPageId('canvas')).toBe('page-b');
    // page-b's Text resolved its literal binding, so the graph really was
    // rebuilt for the new page rather than merely re-pointed.
    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');
  });

  test("the previous page's exposed values and page variables are gone", async () => {
    seedModule();
    state().setExposedValue('c1', 'value', 'typed by the user');
    state().setPageVariable('cameFromPageA', 'leaked');
    expect(state().getExposedValueOfComponent('c1').value).toBe('typed by the user');

    state().switchPage('page-b', 'b');
    await settle();

    // INTENTIONAL ToolJet design, not a bug: page-A state is never addressable
    // from page B (the widget tree is fully remounted). Anyone "preserving"
    // component state across a page switch breaks this contract — and anyone
    // filing a bug about it should be pointed here.
    // Read the raw store, NOT getExposedValueOfComponent: that accessor looks
    // c1 up in getCurrentPageComponents first (resolvedSlice.js:736-751), so
    // once page-b is current it returns {} for c1 whether or not the value was
    // actually cleared — a vacuous assertion.
    expect(Object.keys(state().resolvedStore.modules.canvas.exposedValues.components)).toEqual(['c2']);
    expect(state().resolvedStore.modules.canvas.exposedValues.page.variables).toEqual({});
  });

  test('a switch to the SAME page still mints a new pageKey, so the canvas remounts', async () => {
    seedModule();
    const keyBefore = state().pageKey;

    state().switchPage('page-a', 'a');
    await settle();

    // Regression for commit a0a412150e / PR #15034: AppCanvas.jsx keys the
    // Container on pageKey. Without a fresh key, a "switch to page" CSA
    // targeting the page you are already on is a no-op on screen and widgets
    // keep their old state.
    expect(state().pageKey).not.toBe(keyBefore);
  });

  test('a switch to a DIFFERENT page leaves pageKey alone', async () => {
    seedModule();
    const keyBefore = state().pageKey;

    state().switchPage('page-b', 'b');
    await settle();

    // The remount is already forced by currentPageId changing; re-keying here
    // too would throw away the tree twice per navigation.
    expect(state().pageKey).toBe(keyBefore);
  });

  test('pending dependency-triggered query rerun timers are cancelled', async () => {
    jest.useFakeTimers();
    seedModule();
    const query = {
      id: 'q1',
      name: 'query1',
      kind: 'restapi',
      options: { url: '{{components.textinput1.value}}', runOnDependencyChange: true },
    };
    state().dataQuery.setQueries([query], 'canvas');
    state().setQueryMapping('canvas');
    state().registerQueryDependencies(query.id, query.name, query.kind, query.options, 'canvas');

    // Arm the 500ms trailing rerun (componentsSlice.js:53-69).
    state().setExposedValue('c1', 'value', 'typed');
    state().flushImplicitBatchEntries();

    state().switchPage('page-b', 'b');
    await settle({ fakeTimers: true });
    jest.advanceTimersByTime(500);

    // Regression for commit 78a1c36278: initDependencyGraph (called from
    // switchPage, appSlice.js:349) calls clearAllQueryRerunTimers. Without it a
    // query belonging to the page we just LEFT fires against the new page —
    // `isLoading: true` on a query the new page never asked for.
    expect(state().resolvedStore.modules.canvas.exposedValues.queries?.q1?.isLoading).not.toBe(true);
  });
});

describe('switchPage — the re-entrancy guard', () => {
  test('a second call in the same tick is rejected with a toast, not an exception', async () => {
    seedModule();

    state().switchPage('page-b', 'b');
    // pageSwitchInProgress is set synchronously (appSlice.js:266) precisely so
    // this double-click cannot get through.
    expect(state().pageSwitchInProgress).toBe(true);
    expect(() => state().switchPage('page-a', 'a')).not.toThrow();

    expect(toast).toHaveBeenCalledWith('Please wait, page switch in progress', { icon: '⚠️' });
    await settle();
    // The rejected call must not have hijacked the destination.
    expect(state().getCurrentPageId('canvas')).toBe('page-b');
  });

  // Regression guard: pageSwitchInProgress used to be cleared from inside
  // cleanUpStore, called at the very START of doSwitch's body — leaving
  // everything after that, including the `await yieldToMain()` further down,
  // unguarded. A second switchPage landing in that window was accepted, and
  // both doSwitch bodies reached `startExposedValueBatch()`. The batch is
  // ref-counted (batchManager.ts:50-57), so depth became 2 while only one
  // flush was ever issued for it — every exposed-value write in the app
  // buffered forever and the canvas froze.
  //
  // Fixed by never clearing the flag mid-doSwitch at all.
  test('a second call during the async window is rejected, not accepted', async () => {
    seedModule();

    state().switchPage('page-b', 'b');
    // EXACTLY one hop, not settle(): it resolves the first `await yieldToMain()`
    // and leaves doSwitch parked on the second — the window that used to be
    // unguarded. settle() here would run the switch to completion and the call
    // below would be a legitimate new switch, not a re-entrant one.
    await hop();

    state().switchPage('page-a', 'a');
    await settle();

    // The in-flight switch owns the destination; the late call must be rejected.
    expect(state().getCurrentPageId('canvas')).toBe('page-b');
    // A page switch owns exactly ONE bracket, so one flush must close it.
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);
  });

  // Regression guard for the gap the fix above still left open: doSwitch opens
  // its exposed-value batch as its very last step, but that batch is only
  // flushed later, by the isComponentLayoutReady effect in useAppData.js once
  // Suspense/layout settles for the new page — NOT by doSwitch itself. If the
  // guard were released as soon as doSwitch's own synchronous work finished
  // (rather than when the batch it opened actually flushes), two perfectly
  // ordinary, non-racing clicks — switch to page B, then switch to page A a
  // moment later, before B's layout has settled — would each open the batch,
  // stacking depth to 2 with only one flush ever issued. No race window, no
  // CPU throttling needed to hit it.
  test('a second call after doSwitch finishes, but before its batch flushes, is rejected', async () => {
    seedModule();

    state().switchPage('page-b', 'b');
    await settle();
    // doSwitch has fully finished and opened its batch; nothing in this
    // store-only test has flushed it yet (that's useAppData's job, not
    // exercised here) — this is the ordinary post-switch state, not a defect.
    expect(state().isExposedValueBatching()).toBe(true);

    state().switchPage('page-a', 'a');
    expect(toast).toHaveBeenCalledWith('Please wait, page switch in progress', { icon: '⚠️' });
    await settle();

    // The late call must be rejected — it must not have opened a second,
    // never-to-be-closed nested batch.
    expect(state().getCurrentPageId('canvas')).toBe('page-b');
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);
    // The other half of the guard's lifecycle: the post-flush callback must
    // actually release it. Without this assertion, a removed or broken
    // callback would leave pageSwitchInProgress stuck true forever — every
    // later switch permanently rejected — while this test still passed.
    expect(state().pageSwitchInProgress).toBe(false);
  });
});

describe('switchPage — module scoping', () => {
  // BUG, still unfixed: cleanUpStore(isPageSwitch, moduleId) ignores its
  // moduleId parameter entirely (appSlice.js:368-388) and hard-codes
  // `modules.canvas` / `dependencyGraph.modules.canvas` /
  // `resolvedStore.modules.canvas`. switchPage compounds it by calling
  // `initDependencyGraph('canvas')` with a literal instead of moduleId
  // (appSlice.js:349).
  //
  // This is reachable in production: the switch-page CSA forwards the event's
  // module id (eventsSlice.js:1047), so a "switch page" action inside a module
  // demolishes the HOST app's state.
  //
  // Right behaviour: both should operate on the module being switched.
  test.failing('BUG: switching a module page wipes the host canvas state', async () => {
    seedModule('canvas');
    seedModule('m1');
    state().setPageVariable('hostVar', 'still here', 'canvas');

    state().switchPage('page-b', 'b', [], 'm1');
    await settle();

    // The host canvas was not switched, so nothing of its may be touched.
    expect(state().resolvedStore.modules.canvas.exposedValues.page.variables).toEqual({ hostVar: 'still here' });
    // Wiped and never rebuilt: setComponentNameIdMapping ran for 'm1' only, so
    // every `{{components.<name>...}}` binding on the host canvas is now
    // unresolvable.
    expect(state().modules.canvas.componentNameIdMapping).toEqual({ textinput1: 'c1' });
  });

  test.failing("BUG: switching a module page never resolves the module's new page", async () => {
    seedModule('canvas');
    seedModule('m1');

    state().switchPage('page-b', 'b', [], 'm1');
    await settle();

    expect(state().getCurrentPageId('m1')).toBe('page-b');
    // initDependencyGraph('canvas') rebuilt the WRONG module, so m1's resolved
    // store still describes page-a: the module renders a page it has left.
    expect(Object.keys(state().resolvedStore.modules.m1.components)).toEqual(['c2']);
  });
});
