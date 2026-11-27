import { QueryClient } from '@tanstack/react-query';

import { countPageRowsOfKind, getLoadedDataSourceItems, getSelectedKind } from '../selection';

const folder = (id, count) => ({ kind: 'folder', id, name: id, data_source_count: count });
const dataSource = (id, folderRef = null) => ({
  kind: 'data_source',
  id,
  name: id,
  data_source_kind: 'postgresql',
  folder: folderRef,
});

describe('getSelectedKind', () => {
  test('reads the kind from the first selected row id', () => {
    expect(getSelectedKind({ 'data_source:d-1': true })).toBe('data_source');
    expect(getSelectedKind({ 'folder:f-1': true })).toBe('folder');
    expect(getSelectedKind({})).toBeNull();
  });
});

describe('countPageRowsOfKind', () => {
  // A pinned data source in folder f-1 is listed at root too.
  const ITEMS = [
    dataSource('d-pinned', { id: 'f-1', name: 'f-1' }),
    folder('f-1', 3),
    folder('f-2', 5),
    dataSource('d-1'),
  ];

  test('counts root folder rows for folders', () => {
    expect(countPageRowsOfKind(ITEMS, {}, 'folder')).toBe(2);
  });

  test('counts root data sources while every folder is closed', () => {
    expect(countPageRowsOfKind(ITEMS, {}, 'data_source')).toBe(2);
  });

  test("adds an open folder's count and skips its pinned data source listed at root", () => {
    expect(countPageRowsOfKind(ITEMS, { 'folder:f-1': true }, 'data_source')).toBe(1 + 3);
  });

  test('counts nothing without a selection', () => {
    expect(countPageRowsOfKind(ITEMS, {}, null)).toBe(0);
  });
});

describe('getLoadedDataSourceItems', () => {
  test('finds rows in root pages and expanded folders, with the folder name from a folder page', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['dataSourcesV2', { pageNo: 1 }], {
      items: [dataSource('d-1', { id: 'f-1', name: 'Core' }), folder('f-2', 0)],
      folder: null,
    });
    queryClient.setQueryData(['dataSourcesV2', { folderId: 'f-3' }, 'infinite'], {
      pages: [{ items: [dataSource('d-2')], folder: { id: 'f-3', name: 'Billing' } }],
      pageParams: [1],
    });

    expect(getLoadedDataSourceItems(queryClient, ['d-1', 'd-2', 'f-2', 'gone'])).toEqual([
      { id: 'd-1', name: 'd-1', kind: 'data_source', dataSourceKind: 'postgresql', folderName: 'Core' },
      { id: 'd-2', name: 'd-2', kind: 'data_source', dataSourceKind: 'postgresql', folderName: 'Billing' },
      { id: 'f-2', name: 'f-2', kind: 'folder', dataSourceKind: undefined, folderName: undefined },
      { id: 'gone', name: 'gone' },
    ]);
  });
});
