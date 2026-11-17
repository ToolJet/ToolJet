import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-30: an Ant Design Table whose rows share an id ticked and highlighted them together. Ticking First A ticked
// First B too and selectedRows held both; with no row selection, clicking First B highlighted both rows. Both rows
// had the row key 1. The pack's Table, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// A new copy each time: a query run again gives the same records as new objects.
const rows = () => [
  { id: 1, name: 'First A' },
  { id: 1, name: 'First B' },
  { id: 2, name: 'Second' },
];
const columns = [{ title: 'Name', dataIndex: 'name' }];
const tableRows = (v) => [...v.root().querySelectorAll('.ant-table-tbody tr.ant-table-row')];
const checkbox = (row) => row.querySelector('input[type="checkbox"]');
const nameCell = (row) => row.querySelector('td:not(.ant-table-selection-column)');
const ticked = (v) =>
  tableRows(v)
    .filter((row) => checkbox(row).checked)
    .map((row) => row.textContent);
const highlighted = (v) =>
  tableRows(v)
    .filter((row) => row.classList.contains('tj-ant-row-selected'))
    .map((row) => row.textContent);

describe('Ant Design Table: rows that share an id', () => {
  test('[PackComponent-TABDUP-001] each row has a key of its own', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows(), columns, rowSelection: 'checkbox' });

    const keys = tableRows(v).map((row) => row.getAttribute('data-row-key'));
    expect(new Set(keys).size).toBe(3);
  });

  test('[PackComponent-TABDUP-002] ticking First A ticks only First A, and only it is selected', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows(), columns, rowSelection: 'checkbox' });

    act(() => {
      fireEvent.click(checkbox(tableRows(v)[0]));
    });
    await settle();

    expect(ticked(v)).toEqual(['First A']);
    expect(v.exposed.selectedRowKeys).toEqual([1]);
    expect(v.exposed.selectedRows).toEqual([{ id: 1, name: 'First A' }]);
  });

  test('[PackComponent-TABDUP-003] with no row selection, clicking First B highlights only First B', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows(), columns, rowSelection: 'none' });

    act(() => {
      fireEvent.click(nameCell(tableRows(v)[1]));
    });
    await settle();

    expect(highlighted(v)).toEqual(['First B']);
    expect(v.exposed.selectedRow).toEqual({ id: 1, name: 'First B' });
  });

  test('[PackComponent-TABDUP-004] the same records again keep First B ticked and highlighted, not First A', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows(), columns, rowSelection: 'checkbox' });
    act(() => {
      fireEvent.click(nameCell(tableRows(v)[1]));
      fireEvent.click(checkbox(tableRows(v)[1]));
    });
    await settle();
    expect(ticked(v)).toEqual(['First B']);

    await v.update({ props: { dataSource: rows(), columns, rowSelection: 'checkbox' } });
    await settle();

    expect(ticked(v)).toEqual(['First B']);
    expect(highlighted(v)).toEqual(['First B']);
    expect(v.exposed.selectedRows).toEqual([{ id: 1, name: 'First B' }]);
    expect(v.exposed.selectedRow).toEqual({ id: 1, name: 'First B' });
  });

  // Characterization: a record whose id no other row holds is still followed through an edit.
  test('[PackComponent-TABDUP-005] a record with an id of its own is followed as it is now after an edit', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows(), columns, rowSelection: 'checkbox' });
    act(() => {
      fireEvent.click(checkbox(tableRows(v)[2]));
    });
    await settle();

    const edited = rows();
    edited[2] = { id: 2, name: 'Second, edited' };
    await v.update({ props: { dataSource: edited, columns, rowSelection: 'checkbox' } });
    await settle();

    expect(ticked(v)).toEqual(['Second, edited']);
    expect(v.exposed.selectedRowKeys).toEqual([2]);
    expect(v.exposed.selectedRows).toEqual([{ id: 2, name: 'Second, edited' }]);
  });
});
