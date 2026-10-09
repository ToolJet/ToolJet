/**
 * ListView row-scope regression suite.
 *
 * The highest-recurrence bug family in the App Builder: a binding inside a
 * ListView row resolves to `undefined` instead of the row's actual value.
 * Seven separate fix commits so far (041e490beb / #16262, eed74a6d58 / #16205,
 * 0c4ee77a73 / #16213, 1b9583b866, 44c5942857, 3ff43e4dc8, 906fe1770d).
 *
 * Everything here runs against the REAL store (`@/AppBuilder/_stores/store`);
 * nothing in the row-scope path is mocked. `__mocks__/zustand.js` resets the
 * store singleton after each test.
 *
 * Subject under test: src/AppBuilder/_stores/slices/componentSlices/listViewComponentSlice.js
 *   - prepareRowScope / updateRowScope (exported store actions)
 *   - setExposedValuePerRow / setExposedValuesPerRow (exported store actions)
 *   - scheduleExposedValuesPerRow / scheduleDeriveChain are private slice
 *     closures, so they are exercised through setExposedValue(s)PerRow.
 */
import useStore from '@/AppBuilder/_stores/store';
import { resolveDynamicValues } from '@/AppBuilder/_stores/utils';

// 36-char UUIDs — prepareRowScope's slot detection regex (`/([a-fA-F0-9-]{36})-.+/`)
// only recognises a slot key when the base id is exactly 36 chars.
const LV = '11111111-1111-4111-8111-111111111111';
const TEXT_INPUT = '22222222-2222-4222-8222-222222222222';
const TABS = '33333333-3333-4333-8333-333333333333';
const TAB_CHILD_BASE = '44444444-4444-4444-8444-444444444444';
const TAB_CHILD_SLOT = '55555555-5555-4555-8555-555555555555';
const FLAT_INPUT = '66666666-6666-4666-8666-666666666666';

const PAGE_ID = 'page-1';

const component = (name, type, parent = null) => ({
  component: { name, component: type, parent, definition: { properties: {}, styles: {} } },
  layouts: {},
});

/** Seed `modules.canvas.pages` so getComponentDefinition / getComponentNameFromId resolve. */
const seedPage = (components) => {
  useStore.setState((state) => {
    state.modules.canvas.currentPageId = PAGE_ID;
    state.modules.canvas.currentPageIndex = 0;
    state.modules.canvas.pages = [{ id: PAGE_ID, components }];
    state.modules.canvas.componentNameIdMapping = Object.fromEntries(
      Object.entries(components).map(([id, def]) => [def.component.name, id])
    );
  });
};

const seedChildrenMapping = (mapping) => {
  useStore.setState((state) => {
    state.containerChildrenMapping = { canvas: [], ...mapping };
  });
};

const seedExposedComponents = (values) => {
  useStore.setState((state) => {
    state.resolvedStore.modules.canvas.exposedValues.components = values;
  });
};

const exposedComponents = () => useStore.getState().resolvedStore.modules.canvas.exposedValues.components;

/**
 * Mirrors production's row-scoped resolve path
 * (buildRowScopedState in componentsSlice.js:119-124 → resolveDynamicValues):
 * prepareRowScope once, updateRowScope per row, resolve against
 * `{ ...state, components: scopeCtx.scoped }`.
 */
const resolveInRow = (listviewId, rowIndex, expression) => {
  const { getAllExposedValues, prepareRowScope, updateRowScope } = useStore.getState();
  const state = getAllExposedValues('canvas');
  const scopeCtx = prepareRowScope(state.components, listviewId, 'canvas');
  expect(scopeCtx).not.toBeNull();
  updateRowScope(scopeCtx, rowIndex);
  return resolveDynamicValues(expression, { ...state, components: scopeCtx.scoped }, {}, false, []);
};

// Bracket form is what extractAndReplaceReferencesFromString hands the resolver —
// `components.<uuid>.value` would be parsed as arithmetic.
const binding = (id, property = 'value') => `{{components['${id}'].${property}}}`;

describe('prepareRowScope / updateRowScope — descendant overlay', () => {
  describe('descendant whose exposed values are stored per row (array)', () => {
    beforeEach(() => {
      seedPage({
        [LV]: component('listview1', 'Listview'),
        [TEXT_INPUT]: component('textinput1', 'TextInput', LV),
      });
      seedChildrenMapping({ [LV]: [TEXT_INPUT] });
    });

    it('resolves each row to that row own value', () => {
      seedExposedComponents({ [TEXT_INPUT]: [{ value: 'row-zero' }, { value: 'row-one' }] });

      expect(resolveInRow(LV, 0, binding(TEXT_INPUT))).toBe('row-zero');
      expect(resolveInRow(LV, 1, binding(TEXT_INPUT))).toBe('row-one');
    });

    it('falls back to an empty row object when the row index is missing', () => {
      seedExposedComponents({ [TEXT_INPUT]: [{ value: 'row-zero' }] });

      expect(resolveInRow(LV, 5, binding(TEXT_INPUT))).toBeUndefined();
    });

    it('leaves non-descendant components resolving through the prototype to their global value', () => {
      seedPage({
        [LV]: component('listview1', 'Listview'),
        [TEXT_INPUT]: component('textinput1', 'TextInput', LV),
        [FLAT_INPUT]: component('textinput2', 'TextInput'),
      });
      seedExposedComponents({
        [TEXT_INPUT]: [{ value: 'row-zero' }],
        [FLAT_INPUT]: { value: 'canvas-level' },
      });

      expect(resolveInRow(LV, 0, binding(FLAT_INPUT))).toBe('canvas-level');
    });
  });

  describe('descendant whose exposed values are still a plain object (first flat publish)', () => {
    beforeEach(() => {
      seedPage({
        [LV]: component('listview1', 'Listview'),
        [TEXT_INPUT]: component('textinput1', 'TextInput', LV),
      });
      seedChildrenMapping({ [LV]: [TEXT_INPUT] });
      // A first publish through the flat setExposedValues path writes
      // `{ [key]: value }` (resolvedSlice.js:501-517), NOT a per-row array.
      seedExposedComponents({ [TEXT_INPUT]: { value: 'hello' } });
    });

    it('BUG: overlay keeps the pre-created {} and shadows the real object', () => {
      // Documents the current (wrong) behaviour so the bug below is unambiguous.
      const { getAllExposedValues, prepareRowScope, updateRowScope } = useStore.getState();
      const state = getAllExposedValues('canvas');
      const scopeCtx = prepareRowScope(state.components, LV, 'canvas');

      // prepareRowScope:325-330 defines an own `{}` for every descendant...
      expect(Object.prototype.hasOwnProperty.call(scopeCtx.scoped, TEXT_INPUT)).toBe(true);
      expect(scopeCtx.scoped[TEXT_INPUT]).toEqual({});

      // ...and updateRowScope:351 only overwrites it when the stored value is an
      // Array, so the object value on the prototype stays shadowed.
      updateRowScope(scopeCtx, 0);
      expect(scopeCtx.scoped[TEXT_INPUT]).toEqual({});
      expect(state.components[TEXT_INPUT]).toEqual({ value: 'hello' });
    });

    // BUG (unfixed): row-scope overlay shadows object-valued descendants.
    // listViewComponentSlice.js:325-330 creates an own `{}` for EVERY descendant;
    // listViewComponentSlice.js:351 only replaces it when `Array.isArray(val)`.
    // A descendant that has not been converted to per-row array storage yet keeps
    // the empty `{}`, and the prototype fall-through to its real value is lost.
    // Wrong: undefined. Right: 'hello' (what the array-stored control above gets).
    test.failing('resolves an object-stored descendant to its value instead of undefined', () => {
      expect(resolveInRow(LV, 0, binding(TEXT_INPUT))).toBe('hello');
    });
  });

  describe('slot-keyed children (Tabs / Form slots inside a ListView)', () => {
    beforeEach(() => {
      seedPage({
        [LV]: component('listview1', 'Listview'),
        [TABS]: component('tabs1', 'Tabs', LV),
        [TAB_CHILD_BASE]: component('textinput1', 'TextInput', TABS),
        [TAB_CHILD_SLOT]: component('textinput2', 'TextInput', `${TABS}-tab0`),
      });
      seedExposedComponents({
        [TAB_CHILD_BASE]: [{ value: 'base-row-zero' }],
        [TAB_CHILD_SLOT]: [{ value: 'slot-row-zero' }],
      });
    });

    const descendantsOf = (listviewId) => {
      const { getAllExposedValues, prepareRowScope } = useStore.getState();
      const state = getAllExposedValues('canvas');
      return prepareRowScope(state.components, listviewId, 'canvas').descendantIds;
    };

    it('collects slot-keyed children when the container has no base children', () => {
      seedChildrenMapping({
        [LV]: [TABS],
        [`${TABS}-tab0`]: [TAB_CHILD_SLOT],
      });

      expect(descendantsOf(LV)).toEqual(expect.arrayContaining([TABS, TAB_CHILD_SLOT]));
      expect(resolveInRow(LV, 0, binding(TAB_CHILD_SLOT))).toBe('slot-row-zero');
    });

    it('collects base children when the container has no slot children', () => {
      seedChildrenMapping({
        [LV]: [TABS],
        [TABS]: [TAB_CHILD_BASE],
      });

      expect(descendantsOf(LV)).toEqual(expect.arrayContaining([TABS, TAB_CHILD_BASE]));
      expect(resolveInRow(LV, 0, binding(TAB_CHILD_BASE))).toBe('base-row-zero');
    });

    // BUG (unfixed): listViewComponentSlice.js:301
    //   const allChildren = children.length > 0 ? children : slotChildren;
    // A container holding BOTH base children and slot children silently drops
    // every slot child, so those components are never row-scoped and their
    // bindings resolve against the raw per-row array.
    // Wrong: descendantIds = [TABS, TAB_CHILD_BASE] and the slot child resolves
    // to undefined. Right: the slot child is a descendant and resolves to
    // 'slot-row-zero'.
    test.failing('collects BOTH base and slot children of the same container', () => {
      seedChildrenMapping({
        [LV]: [TABS],
        [TABS]: [TAB_CHILD_BASE],
        [`${TABS}-tab0`]: [TAB_CHILD_SLOT],
      });

      expect(descendantsOf(LV)).toEqual(expect.arrayContaining([TABS, TAB_CHILD_BASE, TAB_CHILD_SLOT]));
      expect(resolveInRow(LV, 0, binding(TAB_CHILD_SLOT))).toBe('slot-row-zero');
    });
  });
});

describe('per-row exposed value writes are deferred (asymmetric with the flat path)', () => {
  beforeEach(() => {
    seedPage({
      [LV]: component('listview1', 'Listview'),
      [TEXT_INPUT]: component('textinput1', 'TextInput', LV),
      [FLAT_INPUT]: component('textinput2', 'TextInput'),
    });
    seedChildrenMapping({ [LV]: [TEXT_INPUT], canvas: [LV, FLAT_INPUT] });
    seedExposedComponents({});
  });

  it('FOOTGUN: the flat write lands synchronously but the per-row raw write needs 1 microtask', async () => {
    // Flat path (resolvedSlice.setExposedValue) — readable on the very next line.
    useStore.getState().setExposedValue(FLAT_INPUT, 'value', 'flat-now', 'canvas');
    expect(exposedComponents()[FLAT_INPUT]).toEqual({ value: 'flat-now' });

    // Per-row path (listViewComponentSlice.setExposedValuePerRow) — the RAW WRITE
    // itself is deferred to queueMicrotask by scheduleExposedValuesPerRow
    // (listViewComponentSlice.js:44-46), so the same-tick read sees nothing.
    useStore.getState().setExposedValuePerRow(TEXT_INPUT, 'value', 'row-later', [0], 'canvas');
    expect(exposedComponents()[TEXT_INPUT]).toBeUndefined();

    await Promise.resolve();
    expect(exposedComponents()[TEXT_INPUT]).toEqual([{ value: 'row-later' }]);
  });

  it('setExposedValuesPerRow defers its raw multi-key write by exactly 1 microtask', async () => {
    useStore.getState().setExposedValuesPerRow(TEXT_INPUT, { value: 'a', isValid: true }, [1], 'canvas');
    expect(exposedComponents()[TEXT_INPUT]).toBeUndefined();

    await Promise.resolve();
    expect(exposedComponents()[TEXT_INPUT][1]).toEqual({ value: 'a', isValid: true });
  });

  it("coalesces same-tick per-row writes for the same slot into the flushed row's object", async () => {
    const { setExposedValuePerRow } = useStore.getState();
    setExposedValuePerRow(TEXT_INPUT, 'value', 'first', [0], 'canvas');
    setExposedValuePerRow(TEXT_INPUT, 'isValid', false, [0], 'canvas');

    await Promise.resolve();
    expect(exposedComponents()[TEXT_INPUT][0]).toEqual({ value: 'first', isValid: false });
  });

  it("the parent ListView's derived children/data lag the raw row write by a SECOND microtask", async () => {
    useStore.getState().setExposedValuePerRow(TEXT_INPUT, 'value', 'row-later', [0], 'canvas');

    // Microtask 1: scheduleExposedValuesPerRow flush → raw write lands, and it
    // only THEN calls scheduleDeriveChain (listViewComponentSlice.js:93), which
    // queues a second microtask (listViewComponentSlice.js:18).
    await Promise.resolve();
    expect(exposedComponents()[TEXT_INPUT]).toEqual([{ value: 'row-later' }]);
    expect(exposedComponents()[LV]?.children).toBeUndefined();

    // Microtask 2: _deriveListviewChain → deriveListviewExposedData.
    await Promise.resolve();
    expect(exposedComponents()[LV].children[0]).toEqual({
      textinput1: { value: 'row-later', id: TEXT_INPUT },
    });
    expect(exposedComponents()[LV].data[0]).toEqual({
      textinput1: { value: 'row-later', id: TEXT_INPUT },
    });
  });
});
