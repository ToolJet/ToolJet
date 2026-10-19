// Release audit round 3: Codex's fixture reviewTableSelectionMatchParity. Table: selectRow, selectRows and deselectRows
// match a cell to a value by one rule, the native Table's == (selectRow used ==, the plural actions compared text).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadTable',
  id: 'table1',
  handle: 'table1',
  widgetWidth: 800,
  widgetHeight: 400,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

test.each([
  ['null', null, null],
  ['empty string', '', ''],
  ['zero', 0, 0],
  ['false', false, false],
  ['number string', 1, '1'],
  ['leading zero string', 1, '01'],
  ['boolean numeric', false, 0],
])('%s: selectRow, selectRows and deselectRows agree', async (label, cell, lookup) => {
  w.render({
    currentMode: 'view',
    properties: {
      data: binding([{ id: 'A', match: cell }]),
      columns: binding([{ key: 'match', name: 'Match' }]),
      enableMultipleRowSelection: binding(true),
    },
  });
  await w.act('selectRow', 'match', lookup);
  const single = w.exposed().selectedRows;
  expect(single.map((r) => r.id)).toEqual(['A']);
  await w.act('deselectAllRows');
  expect(w.exposed().selectedRows).toEqual([]);
  await w.act('selectRows', 'match', [lookup]);
  expect(w.exposed().selectedRows).toEqual(single);
  await w.act('deselectRows', 'match', [lookup]);
  expect(w.exposed().selectedRows).toEqual([]);
});

test.each([
  ['different text', '01', '1'],
  ['null and zero', null, 0],
  ['null and empty string', null, ''],
  ['NaN', NaN, NaN],
])('%s: no action matches', async (label, cell, lookup) => {
  w.render({
    currentMode: 'view',
    properties: { data: binding([{ id: 'A', match: cell }]), columns: binding([{ key: 'match', name: 'Match' }]) },
  });
  await w.act('selectRow', 'match', lookup);
  await w.act('selectRows', 'match', [lookup]);
  expect(w.exposed().selectedRows).toEqual([]);
});
