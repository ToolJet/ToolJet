/**
 * A ListView's `children`/`data` hold each row's child values. Rows written inside an exposed-value batch (a ListView
 * mounting its rows) are derived together once it's applied: every row, nested ListViews from the inside out, and the
 * selected row kept in sync.
 */
import useStore from '@/AppBuilder/_stores/store';

const OUTER = '11111111-1111-4111-8111-111111111111';
const INNER = '22222222-2222-4222-8222-222222222222';
const TEXT = '33333333-3333-4333-8333-333333333333';
const PAGE_ID = 'page-1';

const component = (name, type, parent = null) => ({
  component: { name, component: type, parent, definition: { properties: {}, styles: {} } },
  layouts: {},
});

const seed = (components, mapping, exposed = {}) =>
  useStore.setState((state) => {
    state.modules.canvas.currentPageId = PAGE_ID;
    state.modules.canvas.currentPageIndex = 0;
    state.modules.canvas.pages = [{ id: PAGE_ID, components }];
    state.modules.canvas.componentNameIdMapping = Object.fromEntries(
      Object.entries(components).map(([id, def]) => [def.component.name, id])
    );
    state.containerChildrenMapping = { canvas: [], ...mapping };
    state.resolvedStore.modules.canvas.exposedValues.components = exposed;
  });

const exposed = () => useStore.getState().resolvedStore.modules.canvas.exposedValues.components;

// Writes each row's text value inside one batch, as a ListView does while its rows mount.
const writeRowsInBatch = (rows) => {
  const { startExposedValueBatch, setExposedValuePerRow, flushExposedValueBatch } = useStore.getState();
  startExposedValueBatch();
  rows.forEach(([indices, value]) => setExposedValuePerRow(TEXT, 'text', value, indices, 'canvas'));
  flushExposedValueBatch();
};

describe('ListView rows derived after a batch', () => {
  test('every row written in the batch', () => {
    seed(
      { [OUTER]: component('listview1', 'Listview'), [TEXT]: component('text1', 'Text', OUTER) },
      { [OUTER]: [TEXT] }
    );
    writeRowsInBatch([
      [[0], 'a'],
      [[1], 'b'],
      [[2], 'c'],
    ]);
    expect(exposed()[OUTER].children).toEqual({
      0: { text1: { text: 'a', id: TEXT } },
      1: { text1: { text: 'b', id: TEXT } },
      2: { text1: { text: 'c', id: TEXT } },
    });
    expect(exposed()[OUTER].data[2]).toEqual({ text1: { text: 'c', id: TEXT } });
  });

  test('a nested ListView from the inside out: the outer row holds the inner rows', () => {
    seed(
      {
        [OUTER]: component('listview1', 'Listview'),
        [INNER]: component('listview2', 'Listview', OUTER),
        [TEXT]: component('text1', 'Text', INNER),
      },
      { [OUTER]: [INNER], [INNER]: [TEXT] },
      { [INNER]: [] }
    );
    writeRowsInBatch([
      [[0, 0], 'a'],
      [[0, 1], 'b'],
      [[1, 0], 'c'],
    ]);
    expect(exposed()[INNER][0].children[1]).toEqual({ text1: { text: 'b', id: TEXT } });
    expect(exposed()[OUTER].children[0].listview2.children).toEqual({
      0: { text1: { text: 'a', id: TEXT } },
      1: { text1: { text: 'b', id: TEXT } },
    });
    expect(exposed()[OUTER].children[1].listview2.children[0]).toEqual({ text1: { text: 'c', id: TEXT } });
  });

  test('the selected row follows its children', () => {
    seed(
      { [OUTER]: component('listview1', 'Listview'), [TEXT]: component('text1', 'Text', OUTER) },
      { [OUTER]: [TEXT] },
      { [OUTER]: { selectedRecordId: 1, selectedRowId: 1 } }
    );
    writeRowsInBatch([
      [[0], 'a'],
      [[1], 'b'],
    ]);
    expect(exposed()[OUTER].selectedRecord).toEqual({ text1: { text: 'b', id: TEXT } });
    expect(exposed()[OUTER].selectedRow).toEqual({ text1: { text: 'b', id: TEXT } });
  });
});
