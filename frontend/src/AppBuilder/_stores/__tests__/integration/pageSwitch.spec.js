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
  // A second switchPage while one is still in flight no longer waits for it —
  // it cancels the first switch's own outstanding batch entries (only its
  // own, tagged by moduleId — see batchManager.ts's cancelBatch) and takes
  // over immediately. The old doSwitch is stopped by a generation check, so
  // it can't clobber the new one after being superseded.
  test('a second call in the same tick cancels the first and takes over', async () => {
    seedModule();

    state().switchPage('page-b', 'b');
    expect(state().pageSwitchInProgress).toBe(true);
    expect(() => state().switchPage('page-a', 'a')).not.toThrow();

    // No more "please wait" — the newer call is accepted outright.
    expect(toast).not.toHaveBeenCalledWith('Please wait, page switch in progress', { icon: '⚠️' });
    await settle();
    // The newer call owns the destination.
    expect(state().getCurrentPageId('canvas')).toBe('page-a');
  });

  test('a second call during the async window cancels the first, no leaked batch', async () => {
    seedModule();

    state().switchPage('page-b', 'b');
    // EXACTLY one hop: resolves the first `await yieldToMain()`, leaving
    // doSwitch parked on the second.
    await hop();

    state().switchPage('page-a', 'a');
    await settle();

    // The newer call wins outright.
    expect(state().getCurrentPageId('canvas')).toBe('page-a');
    // Only page-a's own switch owns a bracket now — one flush fully closes it.
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);
    expect(state().pageSwitchInProgress).toBe(false);
  });

  // The actual point of the selective-discard design: a page switch on 'canvas'
  // being cancelled must not destroy another module's (e.g. an embedded
  // Module's) writes that happen to share the same open batch.
  test('cancelling a canvas switch does not discard another module’s pending writes', async () => {
    seedModule('canvas');
    seedModule('m1');

    state().switchPage('page-b', 'b');
    await settle();
    expect(state().isExposedValueBatching()).toBe(true);

    // A Module's own write rides along on the still-open shared batch. c1
    // already has default exposed values from seeding — only 'value' changes.
    expect(state().resolvedStore.modules.m1.exposedValues.components.c1.value).toBe('');
    state().setExposedValue('c1', 'value', 'from module m1', 'm1');
    expect(state().resolvedStore.modules.m1.exposedValues.components.c1.value).toBe('');

    // A second canvas switch cancels canvas's own contribution — canvas's was
    // the only thing keeping depth open, so it reaches 0 immediately and the
    // surviving (m1) entry is applied right there, before page-a's own new
    // doSwitch even starts.
    state().switchPage('page-a', 'a');
    expect(state().resolvedStore.modules.m1.exposedValues.components.c1.value).toBe('from module m1');

    // page-a's own switch has since opened a fresh batch of its own (same as
    // any completed switch does) — flush it to close out cleanly.
    await settle();
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);
  });

  test('a module write survives cancellation even when its own batch is still open', async () => {
    seedModule('canvas');
    seedModule('m1');

    state().switchPage('page-b', 'b');
    await settle();

    // m1 has its own, still-open reason to be batching (e.g. a ListView
    // growing rows) independent of the canvas switch.
    state().startExposedValueBatch();
    state().setExposedValue('c1', 'value', 'from module m1', 'm1');

    state().switchPage('page-a', 'a');
    await settle();

    // canvas's contribution is gone, but m1's batch is still legitimately
    // open — nothing should have been applied or discarded yet.
    expect(state().isExposedValueBatching()).toBe(true);
    expect(state().resolvedStore.modules.m1.exposedValues.components.c1.value).toBe('');

    // Two things are now holding depth open — m1's own batch, and page-a's
    // freshly-opened one — so it takes two flushes to fully close.
    state().flushExposedValueBatch();
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);
    expect(state().resolvedStore.modules.m1.exposedValues.components.c1.value).toBe('from module m1');
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
