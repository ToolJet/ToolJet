import type { SortingState } from '@tanstack/react-table';
import { appliedSorts, type SortRule } from '../../rows/rowsQuery';

// The same rules, in the same order, that buildRowsQuery sends to the server.
export const toSortingState = (sortFilters: Record<string, SortRule> | undefined): SortingState =>
  appliedSorts(sortFilters).map(({ column, order }) => ({ id: column as string, desc: order === 'desc' }));
