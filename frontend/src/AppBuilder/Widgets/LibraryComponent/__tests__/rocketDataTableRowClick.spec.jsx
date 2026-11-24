import { fireEvent, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// A Rocket 2.0 DataTable row click, as on ToolJet's Table (NewTable TableData handleRowClick: a row click toggles the
// row's selection, multi-row selection included, and every row click fires onRowClicked):
// - QA DVRL-95: in bulk mode a plain click set selectedRow and fired onRowClicked, but selectedRows stayed [] and no
//   row was drawn selected.
// - QA DVRL-96: a click that deselected the row fired onSelectionChanged but not onRowClicked.

const DATA = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
];
const rows = (t) => [...t.root().querySelectorAll('tbody tr:not(.t2-plain)')];
const clickRow = (t, i) => fireEvent.click(rows(t)[i].querySelector('td:not(.t2-check-cell)'));
const fired = (t, name) => t.events.filter((e) => e === name).length;

describe('a Rocket 2.0 DataTable row click', () => {
  test('[PackComponent-DTCLICK-001] in bulk mode selects the row as its checkbox does, and a second click deselects it', async () => {
    const t = await mountPack('shadcn', 'DataTable', {
      data: DATA,
      showBulkSelector: true,
      disableRowDeselection: false,
    });
    await waitFor(() => expect(rows(t)).toHaveLength(3));

    clickRow(t, 2);
    await waitFor(() => expect(t.exposed.selectedRows).toEqual([DATA[2]]));
    expect(t.exposed.selectedRow).toEqual(DATA[2]);
    expect(rows(t)[2].getAttribute('data-state')).toBe('selected');
    expect(rows(t)[2].querySelector('[role="checkbox"]').getAttribute('aria-checked')).toBe('true');
    expect([fired(t, 'onRowClicked'), fired(t, 'onSelectionChanged')]).toEqual([1, 1]);

    clickRow(t, 0);
    await waitFor(() => expect(t.exposed.selectedRows).toEqual([DATA[0], DATA[2]]));
    expect(t.exposed.selectedRow).toEqual(DATA[0]);

    clickRow(t, 2);
    await waitFor(() => expect(t.exposed.selectedRows).toEqual([DATA[0]]));
    expect(rows(t)[2].getAttribute('data-state')).toBeNull();
    expect([fired(t, 'onRowClicked'), fired(t, 'onSelectionChanged')]).toEqual([3, 3]);
  });

  test('[PackComponent-DTCLICK-002] that deselects the row fires onRowClicked as well as onSelectionChanged', async () => {
    const t = await mountPack('shadcn', 'DataTable', { data: DATA, disableRowDeselection: false });
    await waitFor(() => expect(rows(t)).toHaveLength(3));

    clickRow(t, 1);
    await waitFor(() => expect(t.exposed.selectedRow).toEqual(DATA[1]));
    expect([fired(t, 'onRowClicked'), fired(t, 'onSelectionChanged')]).toEqual([1, 1]);

    clickRow(t, 1);
    await waitFor(() => expect(t.exposed.selectedRow).toEqual({}));
    expect(t.exposed.selectedRows).toEqual([]);
    expect([fired(t, 'onRowClicked'), fired(t, 'onSelectionChanged')]).toEqual([2, 2]);
  });

  test('[PackComponent-DTCLICK-003] on the selected row with deselection off keeps it and fires only onRowClicked', async () => {
    const t = await mountPack('shadcn', 'DataTable', { data: DATA });
    await waitFor(() => expect(rows(t)).toHaveLength(3));

    clickRow(t, 1);
    await waitFor(() => expect(t.exposed.selectedRow).toEqual(DATA[1]));
    clickRow(t, 1);
    await waitFor(() => expect(fired(t, 'onRowClicked')).toBe(2));
    expect(t.exposed.selectedRow).toEqual(DATA[1]);
    expect(fired(t, 'onSelectionChanged')).toBe(1);
  });
});
