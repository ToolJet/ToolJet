import type { SortingState } from '@tanstack/react-table';
import { isCompleteSort, type SortRule } from '../../rows/rowsQuery';

// The store keys applied sort rules by the popover's row index, so keys can have gaps after a delete. Priority is
// key order, the same order buildRowsQuery sends to the server.
export const toSortingState = (sortFilters: Record<string, SortRule> | undefined): SortingState =>
  Object.values(sortFilters ?? {})
    .filter(isCompleteSort)
    .map(({ column, order }) => ({ id: column as string, desc: order === 'desc' }));
