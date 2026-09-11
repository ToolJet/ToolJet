/**
 * Contract tests for event dispatch and action execution (`eventsSlice`).
 *
 * Everything here runs against the REAL composed store — no slice is mocked.
 * The bugs this file exists for are all about *dispatch plumbing*: which
 * handlers run, in what order, with which arguments, against which module.
 * A mocked store cannot express any of that, because the wrong-argument bugs
 * below are only visible in the state the real slices end up writing.
 *
 * Two setup facts are load-bearing and easy to get wrong:
 *   - `setEditorLoading(false)` is mandatory. The initial value is `true` and
 *     `fireEvent` hard-returns while the editor is loading (eventsSlice.js:104).
 *   - handler N+1 runs in a LATER microtask than handler N, because
 *     `executeActionsForEventId` awaits each `executeAction` (eventsSlice.js:467).
 *     Only the first handler is observable synchronously; anything that asserts
 *     about a second handler must drain first (`drain()` below).
 *
 * `set-custom-variable` is the probe of choice: a synchronous store write with
 * no network and no DOM, readable at
 * `resolvedStore.modules.<module>.exposedValues.variables`.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const s = () => useStore.getState();

/** Lets every awaited handler in the dispatch loop run to completion. */
const drain = () => new Promise((r) => setTimeout(r, 0));

function bootEditor(moduleId = 'canvas') {
  s().setEditorLoading(false, moduleId);
  s().setCurrentMode('edit', moduleId);
}

/**
 * An `onClick` handler on `component-1`. `index` decides dispatch order,
 * `id` is what `handleEvent` re-checks against the store.
 */
function handler({ id = 'evt-1', index = 0, sourceId = 'component-1', ...event }) {
  return {
    id,
    index,
    sourceId,
    name: id,
    target: 'component',
    event: { eventId: 'onClick', ...event },
  };
}

function setVariable({ key = 'items', value = 'CREATE', ...rest }) {
  return handler({ actionId: 'set-custom-variable', key, value, ...rest });
}

const variables = (moduleId = 'canvas') => s().resolvedStore.modules[moduleId].exposedValues.variables;

const fire = (sourceId = 'component-1', customResolvables = {}) =>
  s().eventsSlice.fireEvent('onClick', sourceId, 'canvas', customResolvables, {});

describe('fireEvent gating', () => {
  test('no action runs while the editor is still loading', async () => {
    s().setCurrentMode('edit', 'canvas');
    s().setEditorLoading(true, 'canvas');
    s().eventsSlice.setEvents([setVariable({})], 'canvas');

    fire();
    await drain();

    // eventsSlice.js:104 — the guard exists so that page-load-time component
    // mounts cannot fire user events against a half-built app.
    expect(variables().items).toBeUndefined();
  });

  test('the same event runs once loading is done', async () => {
    bootEditor();
    s().eventsSlice.setEvents([setVariable({})], 'canvas');

    fire();
    await drain();

    expect(variables().items).toBe('CREATE');
  });
});

describe('handler ordering and sequencing', () => {
  test('handlers run in `index` order, not array order', async () => {
    bootEditor();
    // Deliberately reversed in the array: index 1 first, index 0 second.
    // Both write the same key, so the LAST one to run wins.
    s().eventsSlice.setEvents(
      [setVariable({ id: 'b', index: 1, value: 'SECOND' }), setVariable({ id: 'a', index: 0, value: 'FIRST' })],
      'canvas'
    );

    fire();
    await drain();

    // Sorted by index -> FIRST then SECOND. Unsorted -> SECOND then FIRST.
    expect(variables().items).toBe('SECOND');
  });

  test('a handler is awaited before the next one starts', async () => {
    bootEditor();
    const order = [];
    seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
    bootEditor();

    // An async component handle, driven through `control-component`. This is the
    // only way to observe the `await` at eventsSlice.js:467: with synchronous
    // actions, "sequential" and "concurrent" are indistinguishable.
    s().setExposedValue('c1', 'slowClick', async () => {
      order.push('slow:start');
      await drain();
      order.push('slow:end');
    });
    s().setExposedValue('c1', 'mark', () => order.push('next'));

    s().eventsSlice.setEvents(
      [
        handler({
          id: 'a',
          index: 0,
          actionId: 'control-component',
          componentId: 'c1',
          componentSpecificActionHandle: 'slowClick',
          componentSpecificActionParams: [],
        }),
        handler({
          id: 'b',
          index: 1,
          actionId: 'control-component',
          componentId: 'c1',
          componentSpecificActionHandle: 'mark',
          componentSpecificActionParams: [],
        }),
      ],
      'canvas'
    );

    fire();
    await drain();
    await drain();

    expect(order).toEqual(['slow:start', 'slow:end', 'next']);
  });
});

describe('handler filtering', () => {
  test('a disabled handler does not run', async () => {
    bootEditor();
    s().eventsSlice.setEvents([setVariable({ disabled: true })], 'canvas');

    fire();
    await drain();

    // Guarded twice: the filter in executeActionsForEventId (eventsSlice.js:463)
    // and the early return in executeAction (eventsSlice.js:546). Breaking either
    // one alone leaves the behaviour intact, so this pins the behaviour rather
    // than one line.
    expect(variables().items).toBeUndefined();
  });

  test('a falsy runOnlyIf short-circuits the action', async () => {
    bootEditor();
    s().eventsSlice.setEvents(
      [
        setVariable({ id: 'no', index: 0, key: 'blocked', value: 'X', runOnlyIf: '{{1 === 2}}' }),
        setVariable({ id: 'yes', index: 1, key: 'allowed', value: 'Y', runOnlyIf: '{{1 === 1}}' }),
      ],
      'canvas'
    );

    fire();
    await drain();

    // eventsSlice.js:553-558. The truthy sibling proves the gate is evaluating
    // the expression rather than rejecting every runOnlyIf outright.
    expect(variables().blocked).toBeUndefined();
    expect(variables().allowed).toBe('Y');
  });

  test('handleEvent re-filters the caller’s handlers against the store by id', async () => {
    bootEditor();
    // The store knows about `stored` only. The caller passes a stale handler
    // (`ghost`) that has since been deleted from the app.
    s().eventsSlice.setEvents([setVariable({ id: 'stored', value: 'FROM_STORE' })], 'canvas');

    s().eventsSlice.handleEvent(
      'onClick',
      [setVariable({ id: 'ghost', value: 'FROM_CALLER' })],
      { customVariables: {} },
      'canvas',
      'edit'
    );
    await drain();

    // eventsSlice.js:280-284 intersects the two lists, so neither the stale
    // handler nor the unrequested stored one runs.
    expect(variables().items).toBeUndefined();
  });
});

describe('fireEvent flushes pending dependency work first', () => {
  test('dependent resolved values are current by the time actions dispatch', () => {
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'text1', 'Text', { text: binding('{{components.textinput1.value}}') }),
    });
    bootEditor();
    s().eventsSlice.setEvents([setVariable({})], 'canvas');

    // A write made in this same tick — by this component or another one. The
    // dep cascade is only QUEUED at this point (queueMicrotask in
    // resolvedSlice.scheduleDependencyUpdate), so `text1.properties.text` is stale.
    s().setExposedValue('c1', 'value', 'hello');
    expect(s().getResolvedComponent('c2').properties.text).not.toBe('hello');

    fire();

    // No await here on purpose: eventsSlice.js:100 calls flushImplicitBatchEntries()
    // before dispatching, so every pending cascade has been resolved by the time
    // the first action ran. This is the anti-stale-read guarantee.
    expect(variables().items).toBe('CREATE');
    expect(s().getResolvedComponent('c2').properties.text).toBe('hello');
  });
});

describe('confirmed latent bugs', () => {
  /**
   * BUG — argument slots of executeActionsForEventId, eventsSlice.js:113-123.
   * `onComponentClickEvent(id, mode, moduleId)` calls
   *   executeActionsForEventId('onClick', componentEvents, mode, moduleId)
   * but the signature is
   *   (eventId, events, mode, customVariables, moduleId = 'canvas')
   * so `moduleId` lands in the customVariables slot and the module silently
   * defaults to 'canvas'. Every action of a non-canvas module (a module/nested
   * app instance) therefore reads and writes canvas state.
   */
  test.failing('onComponentClickEvent runs the action against the given module', async () => {
    s().initializeEventsSlice('mod1');
    s().initializeResolvedSlice('mod1');
    bootEditor('mod1');
    s().eventsSlice.setEvents([setVariable({})], 'mod1');

    s().eventsSlice.onComponentClickEvent('component-1', 'edit', 'mod1');
    await drain();

    expect(variables('mod1').items).toBe('CREATE');
    expect(variables('canvas').items).toBeUndefined();
  });

  /**
   * BUG — dropped customVariables, eventsSlice.js:764.
   * `set-table-page` resolves its page index as
   *   getResolvedValue(event.pageIndex, undefined, moduleId)
   * while every sibling action passes `customVariables`. So a row-scoped
   * expression such as `{{cellValue}}` resolves to undefined, and because
   * setTablePageIndex explicitly tolerates `undefined` (eventsSlice.js:241)
   * the widget is asked to go to page `undefined` with no error logged.
   */
  test.failing('set-table-page can use a row-scoped expression for the page index', async () => {
    seedApp({ t1: componentDefinition('t1', 'table1', 'Table') });
    bootEditor();
    const setPage = jest.fn();
    s().setExposedValue('t1', 'setPage', setPage);

    s().eventsSlice.setEvents(
      [handler({ actionId: 'set-table-page', table: 't1', pageIndex: '{{cellValue}}' })],
      'canvas'
    );

    fire('component-1', { cellValue: 2 });
    await drain();

    expect(setPage).toHaveBeenCalledWith(2);
  });

  /**
   * BUG — NaN comparator, eventsSlice.js:464.
   * `(a, b) => a.index - b.index` returns NaN whenever a handler has no
   * `index`, which makes the sort a no-op for that pair and leaves dispatch
   * order dependent on array insertion order. The sibling sort at
   * eventsSlice.js:356 gets this right with `(a?.index ?? 0) - (b?.index ?? 0)`.
   */
  test.failing('a handler with no index sorts as index 0', async () => {
    bootEditor();
    // Insertion order puts index 2 first. With `?? 0` the indexless handler
    // sorts ahead of it, so LAST-writer-wins gives 'INDEXED'.
    s().eventsSlice.setEvents(
      [
        setVariable({ id: 'indexed', index: 2, value: 'INDEXED' }),
        { ...setVariable({ id: 'indexless', value: 'INDEXLESS' }), index: undefined },
      ],
      'canvas'
    );

    fire();
    await drain();

    expect(variables().items).toBe('INDEXED');
  });

  /**
   * BUG — control-component cannot reach a ListView descendant,
   * eventsSlice.js:915-935. Only `parentType === 'Form'` gets the
   * children-lookup special case. For a ListView descendant
   * `getExposedValueOfComponent` returns the PER-ROW ARRAY, so
   * `component[handle]` is undefined, `actionPromise ?? Promise.resolve()`
   * swallows it, and the action is a silent no-op: no handle called, and
   * nothing logged to the debugger either.
   */
  test.failing('control-component reaches a component inside a ListView', async () => {
    const child = componentDefinition('c1', 'textinput1', 'TextInput');
    child.component.parent = 'lv1';
    seedApp({ lv1: componentDefinition('lv1', 'listview1', 'Listview'), c1: child });
    bootEditor();

    const setText = jest.fn();
    s().setExposedValuePerRow('c1', 'setText', setText, [0], 'canvas');
    await drain();

    s().eventsSlice.setEvents(
      [
        handler({
          actionId: 'control-component',
          componentId: 'c1',
          componentSpecificActionHandle: 'setText',
          componentSpecificActionParams: [{ handle: 'text', value: 'hi' }],
        }),
      ],
      'canvas'
    );

    fire();
    await drain();

    expect(setText).toHaveBeenCalledWith('hi');
  });
});
