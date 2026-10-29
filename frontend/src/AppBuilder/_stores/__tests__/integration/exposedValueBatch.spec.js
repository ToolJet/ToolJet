/**
 * Contract tests for the EXPLICIT exposed-value batch bracket
 * (`startExposedValueBatch` / `flushExposedValueBatch`, backed by
 * `createBatchManager` in `_stores/batchManager.ts`).
 *
 * Why this file exists separately from exposedValueCascade.spec.js: the implicit
 * microtask batch only defers the dependency CASCADE — the write itself is always
 * committed synchronously. The explicit bracket defers the MUTATION as well
 * (resolvedSlice.js:501-516), so while it is open the value is absent from the
 * store entirely. Every "the app loaded but no widget published a value" and
 * "the page switched and half the bindings are blank" report is a bracket that
 * was opened and never (or wrongly) closed.
 *
 * The bracket has three independent owners, all sharing ONE module-level ref
 * count inside `createResolvedSlice`'s closure:
 *   - `_hooks/useAppData.js:639`  app load  (flushed at :664, only when
 *                                 isComponentLayoutReady && isLicenseFetched)
 *   - `_stores/slices/appSlice.js:353`  switchPage (never flushed on the happy path;
 *                                 only the .catch at :361 flushes)
 *   - `_hooks/useExposedValueBatch.js:27`  ListView/Form row growth (flushed at :37,
 *                                 plus an unmount safety net at :45 that flushes ANY
 *                                 open batch, including one it does not own)
 * None of them can tell whether the bracket it is closing is its own. Tests 7 and 8
 * pin the consequences.
 *
 * No slice is mocked — this is the real composed store. Reads go straight through
 * `useStore.getState()` rather than an act()-wrapped session, because act() flushes
 * microtasks and would make the very windows under test unobservable.
 *
 * KNOWN HARNESS HAZARD: `__mocks__/zustand.js` resets store STATE after each test,
 * but the batch ref count (`_depth`) lives in `createResolvedSlice`'s closure and is
 * NOT reset. A test that leaves a bracket open poisons every test after it. Verified
 * live: with the drain in `finally` removed from 'an unflushed bracket buffers
 * forever', the trailing hermeticity test at the bottom of this file fails. Any test
 * here that opens a bracket must close it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

/** text1.properties.text renders whatever textinput1 exposes as `value`. */
function seedInputAndLabel() {
  return seedApp({
    c1: componentDefinition('c1', 'textinput1', 'TextInput'),
    c2: componentDefinition('c2', 'text1', 'Text', {
      text: binding('{{components.textinput1.value}}'),
    }),
  });
}

describe('explicit bracket: what is observable while it is open', () => {
  test('a buffered write is not in the store at all until flush', () => {
    seedInputAndLabel();
    // initDependencyGraph pre-seeds TextInput's defaults, so `value` already
    // exists as ''. `newKey` does not exist at all — it is the cleaner probe for
    // "the mutation itself was buffered", not just "the cascade was deferred".
    expect(state().getExposedValueOfComponent('c1').value).toBe('');
    expect(state().getExposedValueOfComponent('c1').newKey).toBeUndefined();

    state().startExposedValueBatch();
    state().setExposedValues('c1', 'components', { value: 'hello', newKey: 'brand-new' });

    // Not deferred-cascade-but-committed: genuinely absent.
    expect(state().getExposedValueOfComponent('c1').value).toBe('');
    expect(state().getExposedValueOfComponent('c1').newKey).toBeUndefined();

    state().flushExposedValueBatch();

    expect(state().getExposedValueOfComponent('c1').value).toBe('hello');
    expect(state().getExposedValueOfComponent('c1').newKey).toBe('brand-new');
  });

  test('isExposedValueBatching reflects the open/closed state of the bracket', () => {
    seedInputAndLabel();

    expect(state().isExposedValueBatching()).toBe(false);
    state().startExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(true);
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);
  });

  test('dependents are stale for the whole bracket and correct SYNCHRONOUSLY at flush', () => {
    seedInputAndLabel();

    state().startExposedValueBatch();
    state().setExposedValues('c1', 'components', { value: 'hello' });

    expect(state().getResolvedComponent('c2').properties.text).toBe('');

    state().flushExposedValueBatch();

    // No `await Promise.resolve()` here, deliberately. Unlike the implicit
    // microtask batch, the explicit flush runs updateDependencyValues inline
    // (batchManager.ts:115-120), which is what lets useAppData's app-load flush
    // settle the whole graph inside its suppressQueryRerun window.
    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');
  });

  test('nesting is ref-counted: two starts need two flushes', () => {
    seedInputAndLabel();

    state().startExposedValueBatch();
    state().startExposedValueBatch();
    state().setExposedValues('c1', 'components', { value: 'nested' });

    state().flushExposedValueBatch();
    // Inner flush only decrements (batchManager.ts:83-84). This is how app load
    // survives a ListView opening its own bracket in the middle of the window.
    expect(state().isExposedValueBatching()).toBe(true);
    expect(state().getExposedValueOfComponent('c1').value).toBe('');

    state().flushExposedValueBatch();

    expect(state().isExposedValueBatching()).toBe(false);
    expect(state().getExposedValueOfComponent('c1').value).toBe('nested');
  });

  test('outside a bracket the same call commits the write synchronously', () => {
    seedInputAndLabel();

    // Cross-check for the tests above: the deferral is the bracket's doing, not
    // setExposedValues'. (Dependent-cascade timing outside a bracket is covered
    // in exposedValueCascade.spec.js and is not re-asserted here.)
    state().setExposedValues('c1', 'components', { value: 'hello' });

    expect(state().getExposedValueOfComponent('c1').value).toBe('hello');
  });
});

describe('explicit bracket: latent bugs', () => {
  // BUG (unfixed): the batched arm of setExposedValues — resolvedSlice.js:508-515 —
  // assigns `state...exposedValues[type][id][key] = value` with no guard, while the
  // non-batched arm at resolvedSlice.js:521-524 explicitly handles the same case:
  //     if (existing === undefined || Array.isArray(existing))
  // A component that used to live inside a ListView has its exposed values stored as
  // a per-row ARRAY. Move it onto the canvas and let it mount while a bracket is open
  // — i.e. during a page switch (appSlice.js:353) or ListView row growth
  // (useExposedValueBatch.js:27), which is the ordinary case, not the exotic one —
  // and the flush's single set() throws
  //     [Immer] Immer only supports setting array indices and the 'length' property
  // from inside batchManager.ts:100-107. Because every owner's mutations share that
  // one set(), the throw discards the ENTIRE buffer: unrelated components lose their
  // writes too, and the throw escapes into whoever called flush.
  //
  // WRONG (today): flush throws; c1 keeps its stale array; c2's unrelated buffered
  //                write never lands.
  // RIGHT:         flush applies; c1 becomes { value: 2 }; c2's write lands.
  test.failing('a stale per-row array container makes the flush throw and drops the whole batch', () => {
    seedInputAndLabel();

    // c1 as a ListView leftover: per-row array storage instead of a plain object.
    useStore.setState((s) => {
      s.resolvedStore.modules.canvas.exposedValues.components['c1'] = [{ value: 1 }];
    });

    state().startExposedValueBatch();
    state().setExposedValues('c1', 'components', { value: 2 });
    state().setExposedValues('c2', 'components', { marker: 'INNOCENT_BYSTANDER' });

    expect(() => state().flushExposedValueBatch()).not.toThrow();

    const exposed = state().resolvedStore.modules.canvas.exposedValues.components;
    expect(exposed.c1).toEqual({ value: 2 });
    // The real blast radius: c2 has nothing to do with the array, and still loses
    // its write because one set() carries every owner's mutations.
    expect(exposed.c2.marker).toBe('INNOCENT_BYSTANDER');
  });

  test('a foreign flush closes someone else another owner is still filling', () => {
    seedInputAndLabel();

    // Owner A (say useAppData's app-load bracket) opens and buffers.
    state().startExposedValueBatch();
    state().setExposedValues('c1', 'components', { value: 'A1' });
    expect(state().getExposedValueOfComponent('c1').value).toBe('');

    // An unrelated ListView unmounts. Its safety net (useExposedValueBatch.js:45)
    // checks only `isExposedValueBatching()` — it cannot tell whose bracket it is —
    // and closes A's.
    state().flushExposedValueBatch();

    expect(state().isExposedValueBatching()).toBe(false);
    expect(state().getExposedValueOfComponent('c1').value).toBe('A1');

    // A believes it is still coalescing. It is not: every write from here lands
    // immediately, one set() and one cascade each.
    state().setExposedValues('c1', 'components', { value: 'A2' });
    expect(state().getExposedValueOfComponent('c1').value).toBe('A2');

    // And A's own flush is a silent no-op rather than an under-run: the
    // `if (_depth === 0) return` guard at batchManager.ts:82 keeps the ref count
    // from going negative, so the NEXT bracket still opens correctly. Without that
    // guard the count would sit at -1 and the next start would leave it at 0,
    // silently disabling batching for the rest of the session.
    state().flushExposedValueBatch();
    expect(state().isExposedValueBatching()).toBe(false);

    state().startExposedValueBatch();
    state().setExposedValues('c1', 'components', { value: 'A3' });
    expect(state().getExposedValueOfComponent('c1').value).toBe('A2');
    state().flushExposedValueBatch();
    expect(state().getExposedValueOfComponent('c1').value).toBe('A3');
  });

  test('an unflushed bracket buffers forever — nothing any widget publishes is observable', () => {
    seedInputAndLabel();

    try {
      // appSlice.js:353 opens this one at the end of switchPage and, on the happy
      // path, nothing closes it: the only flush is in the .catch at :361. From here
      // on the app renders its pre-switch values and looks frozen.
      state().startExposedValueBatch();

      state().setExposedValues('c1', 'components', { value: 'first' });
      state().setExposedValue('c1', 'label', 'second');
      state().setExposedValues('c2', 'components', { text: 'third' });

      expect(state().getExposedValueOfComponent('c1').value).toBe('');
      expect(state().getExposedValueOfComponent('c1').label).toBeUndefined();
      expect(state().getResolvedComponent('c2').properties.text).toBe('');
      // Still open — no timer, no microtask, nothing reclaims it.
      expect(state().isExposedValueBatching()).toBe(true);
    } finally {
      // Mandatory: `_depth` is closure state that survives the zustand reset (see
      // the header). Without this drain the next test sees an open bracket.
      while (state().isExposedValueBatching()) state().flushExposedValueBatch();
    }
  });
});

describe('setExposedValue vs setExposedValues: the dedup asymmetry is deliberate', () => {
  // These three tests pin a three-way split that looks like an inconsistency and is
  // not. Commit 677d190f85 (PR #17026) reverted the dedup that PR #16943 had added,
  // because initDependencyGraph pre-seeds a component's default exposed values: a
  // widget re-publishing its default on mount then deep-equals what is already
  // stored, the dedup dropped the dependency path, and every fx field bound to that
  // default stopped resolving on app load. Anyone "unifying" these three paths
  // re-breaks #17026.

  /** Overwrite the resolved value so a re-run of the cascade is observable. */
  const plantSentinel = (sentinel) => state().setResolvedComponentByProperty('c2', 'properties', 'text', sentinel);

  test('setExposedValues INSIDE a bracket re-publishes an unchanged value (the #17026 fix)', () => {
    seedInputAndLabel();
    plantSentinel('SENTINEL');

    state().startExposedValueBatch();
    // '' is exactly what initDependencyGraph already seeded — a mount-time
    // re-publish of the default.
    state().setExposedValues('c1', 'components', { value: '' });
    state().flushExposedValueBatch();

    // The dep path is buffered unconditionally for every non-function key
    // (resolvedSlice.js:502-507 — no equality check), so the cascade runs and the
    // fx field resolves. This is the load-bearing behaviour of #17026.
    expect(state().getResolvedComponent('c2').properties.text).toBe('');
  });

  test('setExposedValue (singular) dedups on _.isEqual and returns before buffering anything', () => {
    seedInputAndLabel();
    plantSentinel('SENTINEL');

    state().startExposedValueBatch();
    state().setExposedValue('c1', 'value', '');
    state().flushExposedValueBatch();

    // resolvedSlice.js:485-486 returns early, so neither the mutation nor the dep
    // path is ever buffered — the sentinel survives even across a flush. Note this
    // is the opposite of the plural call above, on purpose.
    expect(state().getResolvedComponent('c2').properties.text).toBe('SENTINEL');
  });

  test('setExposedValues OUTSIDE a bracket skips the cascade for unchanged keys', async () => {
    seedInputAndLabel();
    plantSentinel('SENTINEL');

    state().setExposedValues('c1', 'components', { value: '' });
    await Promise.resolve();

    // The non-batched arm collects equal keys into `skipKeys`
    // (resolvedSlice.js:518, 531-533) and skips their scheduleDependencyUpdate at
    // :545-548. Only the batched arm re-publishes unconditionally — the asymmetry
    // is between the two ARMS of setExposedValues, not only between singular and
    // plural.
    expect(state().getResolvedComponent('c2').properties.text).toBe('SENTINEL');
  });
});

describe('harness hermeticity', () => {
  test('no bracket leaked out of the tests above', () => {
    // `_depth` is not covered by __resetAllStores. If a test above stopped draining
    // its bracket, this is where the whole file starts lying.
    expect(state().isExposedValueBatching()).toBe(false);

    seedInputAndLabel();
    state().setExposedValues('c1', 'components', { value: 'plain' });
    expect(state().getExposedValueOfComponent('c1').value).toBe('plain');
  });
});
