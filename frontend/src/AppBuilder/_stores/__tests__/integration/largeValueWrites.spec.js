/**
 * Large values (a 10k-row binding, a widget re-publishing its rows) must cost the store a constant amount per write.
 *
 * Two costs used to scale with the number of rows, for every binding, at load and on every re-resolve:
 * - Immer's finalize walked and deep-froze every row of a value it had not seen before. sealForStore freezes the top
 *   level first, which Immer reads as "already done". The proof that the walk was skipped is that the rows themselves
 *   are left unfrozen: Immer freezes every object it visits.
 * - setExposedValues ran _.isEqual against the Immer draft, and every nested read of a draft creates a proxy plus a
 *   shallow copy, so an unchanged 10k-row value built a whole proxy tree per write. The check now reads the committed
 *   state.
 *
 * No timing assertions: the walk and the proxies are observed directly, so the test does not flake under load.
 */
import _ from 'lodash';
import { isDraft } from 'immer';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding, drainExposedValueBatch } from '@/test/app-builder';
import { sealForStore } from '@/AppBuilder/_stores/utils/sealForStore';

const ROWS = '{{Array.from({ length: 10000 }, (_, i) => ({ id: i, name: "Row " + i, tags: ["a", "b"] }))}}';
const state = () => useStore.getState();
const rows = (n, name = 'Row') => Array.from({ length: n }, (_, i) => ({ id: i, name: `${name} ${i}`, tags: ['a'] }));

afterEach(() => {
  drainExposedValueBatch();
  jest.restoreAllMocks();
});

describe('a large resolved binding', () => {
  test('is stored whole, with its rows left unwalked by Immer', () => {
    seedApp({ c1: componentDefinition('c1', 'table1', 'Table', { data: binding(ROWS) }) });

    const data = state().getResolvedComponent('c1').properties.data;
    expect(data).toHaveLength(10000);
    expect(data[9999]).toEqual({ id: 9999, name: 'Row 9999', tags: ['a', 'b'] });
    // Sealed at the component level on load, so Immer skips the whole component.
    expect(Object.isFrozen(state().getResolvedComponent('c1'))).toBe(true);
    expect(Object.isFrozen(data[0])).toBe(false);
    expect(Object.isFrozen(data[0].tags)).toBe(false);
  });

  test('a later write through the store copies on write and leaves the stored rows as they were', () => {
    seedApp({ c1: componentDefinition('c1', 'table1', 'Table', { data: binding(ROWS) }) });
    const before = state().getResolvedComponent('c1').properties.data;

    useStore.setState((draft) => {
      draft.resolvedStore.modules.canvas.components.c1.properties.data[0].name = 'Edited';
    });

    const after = state().getResolvedComponent('c1').properties.data;
    expect(after[0].name).toBe('Edited');
    expect(before[0].name).toBe('Row 0');
    expect(after[1]).toBe(before[1]);
  });

  test('a re-resolve of one property stores the new rows the same way', () => {
    seedApp({ c1: componentDefinition('c1', 'table1', 'Table', { data: binding('{{[]}}') }) });

    state().setResolvedComponentByProperty('c1', 'properties', 'data', rows(5000));

    const data = state().getResolvedComponent('c1').properties.data;
    expect(data).toHaveLength(5000);
    expect(Object.isFrozen(data)).toBe(true);
    expect(Object.isFrozen(data[0])).toBe(false);
  });
});

describe('exposed values', () => {
  test('a large exposed value is stored without Immer walking its rows', () => {
    seedApp({ c1: componentDefinition('c1', 'table1', 'Table') });
    const value = rows(10000);

    state().setExposedValues('c1', 'components', { currentData: value });
    state().setExposedValue('c1', 'selectedRows', rows(3000));

    const exposed = state().getExposedValueOfComponent('c1');
    expect(exposed.currentData).toBe(value);
    expect(Object.isFrozen(value[0])).toBe(false);
    expect(exposed.selectedRows).toHaveLength(3000);
    expect(Object.isFrozen(exposed.selectedRows[0])).toBe(false);
  });

  test('the unchanged check reads committed state, never an Immer draft', () => {
    seedApp({ c1: componentDefinition('c1', 'table1', 'Table') });
    state().setExposedValues('c1', 'components', { currentData: rows(2000), searchText: 'a' });
    const isEqual = jest.spyOn(_, 'isEqual');

    state().setExposedValues('c1', 'components', { currentData: rows(2000), searchText: 'b' });

    expect(isEqual).toHaveBeenCalled();
    for (const [a, b] of isEqual.mock.calls) {
      expect(isDraft(a)).toBe(false);
      expect(isDraft(b)).toBe(false);
    }
  });

  test('an equal value is not written again and a changed one is', () => {
    seedApp({
      c1: componentDefinition('c1', 'table1', 'Table'),
      c2: componentDefinition('c2', 'text1', 'Text', { text: binding('{{components.table1.searchText}}') }),
    });
    state().setExposedValues('c1', 'components', { currentData: rows(100), searchText: 'a' });
    const stored = state().getExposedValueOfComponent('c1');

    state().setExposedValues('c1', 'components', { currentData: rows(100), searchText: 'a' });
    expect(state().getExposedValueOfComponent('c1')).toBe(stored);

    state().setExposedValues('c1', 'components', { currentData: rows(100, 'New'), searchText: 'a' });
    const changed = state().getExposedValueOfComponent('c1');
    expect(changed).not.toBe(stored);
    expect(changed.currentData[0].name).toBe('New 0');
    expect(changed.searchText).toBe('a');
  });

  test('values written inside an open batch are sealed too', () => {
    seedApp({ c1: componentDefinition('c1', 'table1', 'Table') });
    const value = rows(1000);

    state().startExposedValueBatch?.();
    state().setExposedValues('c1', 'components', { currentData: value });
    drainExposedValueBatch();

    expect(state().getExposedValueOfComponent('c1').currentData).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value[0])).toBe(false);
  });
});

describe('query results', () => {
  test('rows from a query run are stored without a walk', () => {
    seedApp({});
    const data = rows(10000);

    state().setResolvedQuery('q1', { data, rawData: data, isLoading: false });

    const query = state().resolvedStore.modules.canvas.exposedValues.queries.q1;
    expect(query.data).toBe(data);
    expect(Object.isFrozen(data[0])).toBe(false);
  });
});

describe('sealForStore', () => {
  test('freezes arrays and plain objects at the top only', () => {
    const value = { rows: [{ a: 1 }] };
    expect(sealForStore(value)).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.rows)).toBe(false);
    expect(Object.isFrozen(sealForStore([1, 2]))).toBe(true);
    expect(Object.isFrozen(sealForStore(Object.create(null)))).toBe(true);
  });

  test('leaves primitives, functions and class instances alone', () => {
    class Lazy {
      constructor() {
        this.cache = null;
      }
    }
    const instances = [new Date(), new Map(), new Set(), new Uint8Array(4), new Lazy()];
    instances.forEach((v) => expect(Object.isFrozen(sealForStore(v))).toBe(false));
    const fn = () => 1;
    expect(sealForStore(fn)).toBe(fn);
    expect(Object.isFrozen(fn)).toBe(false);
    [null, undefined, 1, 'a', true].forEach((v) => expect(sealForStore(v)).toBe(v));
  });
});
