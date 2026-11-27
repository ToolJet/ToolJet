import { renderHook } from '@testing-library/react';

import { useDataSourcePinReorder } from '../useDataSourcePinReorder';

const mockReorder = jest.fn();

jest.mock('@/_services/globalDatasource.mutations', () => ({
  useReorderDataSourcePins: () => ({ mutate: mockReorder }),
}));

const row = (id, pinned) => ({ id, kind: id.startsWith('f') ? 'folder' : 'data_source', name: id, pinned });
const ITEMS = [row('f-1', true), row('d-1', true), row('d-2', true), row('d-3', false)];
const ROOT_QUERY_KEY = ['dataSourcesV2', { pageNo: 1 }];
const BASE = { items: ITEMS, pinnedTotal: 3, currentPage: 1, search: '', rootQueryKey: ROOT_QUERY_KEY };

const reorderFor = (overrides = {}) =>
  renderHook(() => useDataSourcePinReorder({ ...BASE, ...overrides })).result.current;

beforeEach(() => {
  mockReorder.mockClear();
});

describe('useDataSourcePinReorder', () => {
  test('allows dragging when every pin is on the unsearched first page', () => {
    expect(reorderFor().isEnabled).toBe(true);
  });

  test.each([
    ['a search is active', { search: 'orders' }],
    ['past the first page', { currentPage: 2 }],
    ['some pins are on another page', { pinnedTotal: 4 }],
  ])('blocks dragging when %s', (_, overrides) => {
    expect(reorderFor(overrides).isEnabled).toBe(false);
  });

  test('only pinned rows are draggable', () => {
    const { isRowReorderable } = reorderFor();
    expect(isRowReorderable({ original: ITEMS[0] })).toBe(true);
    expect(isRowReorderable({ original: ITEMS[3] })).toBe(false);
  });

  test('saves the moved pin order and keeps unpinned rows after it', () => {
    reorderFor().onReorder({ activeId: 'f-1', fromIndex: 0, toIndex: 2 });
    expect(mockReorder).toHaveBeenCalledWith({
      rootQueryKey: ROOT_QUERY_KEY,
      items: [ITEMS[1], ITEMS[2], ITEMS[0], ITEMS[3]],
    });
  });
});
