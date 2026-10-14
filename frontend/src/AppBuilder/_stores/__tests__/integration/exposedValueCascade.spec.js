/**
 * Contract tests for the exposed-value -> resolved-value cascade.
 *
 * These pin down WHEN a write becomes visible to a reader. Every "event fired
 * but read the old value" bug we have shipped is a violation of one of the
 * facts asserted here, so if any of these change, a widget somewhere starts
 * lying about its own state.
 *
 * Read directly from the store rather than through AppBuilderTestSession:
 * `session.store.act` wraps each action in `await act(async () => ...)`, which
 * flushes microtasks before returning and therefore makes the staleness window
 * these tests are about unobservable by construction. No React is rendered
 * here, so the session buys us nothing. Isolation still holds — __mocks__/zustand.js
 * resets every store after each test.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

// text1.properties.text renders whatever textinput1 exposes as `value`.
function seedInputAndLabel() {
  return seedApp({
    c1: componentDefinition('c1', 'textinput1', 'TextInput'),
    c2: componentDefinition('c2', 'text1', 'Text', {
      text: binding('{{components.textinput1.value}}'),
    }),
  });
}

describe('exposed value -> dependent resolved value', () => {
  test('the writer sees its own exposed value synchronously', () => {
    seedInputAndLabel();

    state().setExposedValue('c1', 'value', 'hello');

    expect(state().getExposedValueOfComponent('c1').value).toBe('hello');
  });

  test('a dependent component is STALE in the same tick and correct one microtask later', async () => {
    seedInputAndLabel();

    state().setExposedValue('c1', 'value', 'hello');

    // This is the staleness window every stale-read bug lives in: the raw value
    // is already committed, but the cascade is only queued (queueMicrotask in
    // resolvedSlice.scheduleDependencyUpdate).
    expect(state().getResolvedComponent('c2').properties.text).not.toBe('hello');

    await Promise.resolve();

    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');
  });

  test('flushImplicitBatchEntries closes the window synchronously', () => {
    seedInputAndLabel();

    state().setExposedValue('c1', 'value', 'hello');
    state().flushImplicitBatchEntries();

    // This is the escape hatch fireEvent uses before dispatching actions. Any
    // code path that reads dependent state synchronously after a write must
    // either call this or await a microtask.
    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');
  });

  test('several writes in one tick collapse into a single cascade with the last value', async () => {
    seedInputAndLabel();

    state().setExposedValue('c1', 'value', 'a');
    state().setExposedValue('c1', 'value', 'b');
    state().setExposedValue('c1', 'value', 'c');

    await Promise.resolve();

    expect(state().getResolvedComponent('c2').properties.text).toBe('c');
  });

  test('writing an equal value does not re-run the cascade', async () => {
    seedInputAndLabel();

    state().setExposedValue('c1', 'value', 'hello');
    await Promise.resolve();
    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');

    // Plant a sentinel directly in the resolved store. If re-setting the same
    // exposed value triggered a recompute, the sentinel would be overwritten
    // back to 'hello'. It is not, because setExposedValue returns early on
    // _.isEqual before scheduling any dependency update.
    //
    // The consequence worth knowing: a dependent that is stale for some *other*
    // reason stays stale forever. Re-setting the same value is not a repair.
    state().setResolvedComponentByProperty('c2', 'properties', 'text', 'SENTINEL');
    state().setExposedValue('c1', 'value', 'hello');
    await Promise.resolve();

    expect(state().getResolvedComponent('c2').properties.text).toBe('SENTINEL');
  });

  test('an exposed function never cascades to dependents', async () => {
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'text1', 'Text', {
        text: binding('{{typeof components.textinput1.setValue}}'),
      }),
    });

    state().setExposedValue('c1', 'setValue', () => 'ignored');
    await Promise.resolve();

    // Functions are excluded from depPaths, so a binding that reads one is
    // never recomputed. Widgets must not expect exposed helpers to be reactive.
    expect(state().getResolvedComponent('c2').properties.text).not.toBe('function');
  });

  test('setExposedValues cascades every changed key in one microtask', async () => {
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'text1', 'Text', {
        text: binding('{{components.textinput1.value}}'),
      }),
      c3: componentDefinition('c3', 'text2', 'Text', {
        text: binding('{{components.textinput1.label}}'),
      }),
    });

    state().setExposedValues('c1', 'components', { value: 'v', label: 'l' });
    await Promise.resolve();

    expect(state().getResolvedComponent('c2').properties.text).toBe('v');
    expect(state().getResolvedComponent('c3').properties.text).toBe('l');
  });
});

describe('store isolation', () => {
  test('a previous test cannot leak exposed values into this one', () => {
    seedInputAndLabel();

    // Guards the whole suite: __mocks__/zustand.js must have reset the store.
    // Without this, every assertion above becomes order-dependent.
    // '' is TextInput's seeded default from initDependencyGraph, not a leak —
    // the point is that none of the values written above survived.
    expect(state().getExposedValueOfComponent('c1').value).toBe('');
    expect(state().getResolvedComponent('c2').properties.text).toBe('');
  });
});
