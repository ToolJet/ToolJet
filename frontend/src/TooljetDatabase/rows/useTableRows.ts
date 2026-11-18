import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useTjdbStore } from '../_stores/tjdbStore';
import { buildRowsQuery } from './rowsQuery';

export type TableRow = Record<string, unknown>;
type RowsPage = { rows: TableRow[]; total: number };

// Every rows query sits under this prefix: ['tjdb', 'rows', environmentId, tableId, query].
const ROWS_KEY = ['tjdb', 'rows'] as const;
const EMPTY_ROWS: TableRow[] = [];

type TjdbViewState = {
  queryFilters: Parameters<typeof buildRowsQuery>[0]['filters'];
  sortFilters: Parameters<typeof buildRowsQuery>[0]['sort'];
  pageCount: number;
  pageSize: number;
  selectedEnvironment: { id: string } | null;
  viewTableId: string | null;
};

// The open page of a table's rows, derived from the store's view: changing filters, sort, page or environment
// in the store is what triggers the read. Writes don't refetch by hand; they call useInvalidateTableRows.
export const useTableRows = (tableId: string | undefined, { enabled = true }: { enabled?: boolean } = {}) => {
  // A string selector, so the component re-renders only when the query itself changes.
  const query = useTjdbStore((state: TjdbViewState) =>
    buildRowsQuery({
      filters: state.queryFilters,
      sort: state.sortFilters,
      page: state.pageCount,
      pageSize: state.pageSize,
    })
  );
  const environmentId = useTjdbStore((state: TjdbViewState) => state.selectedEnvironment?.id ?? null);
  // The view is reset for a newly opened table one render after the table changes (openTableView). Until then it
  // still holds the previous table's filters, which can name columns this table lacks.
  const viewIsForTable = useTjdbStore((state: TjdbViewState) => state.viewTableId === tableId);

  const result = useQuery<RowsPage, Error>({
    queryKey: [...ROWS_KEY, environmentId, tableId, query],
    queryFn: async () => {
      const { headers, data, error } = await tooljetDatabaseService.findOne(tableId, query, environmentId ?? undefined);
      if (error) throw new Error(error?.message ?? 'Something went wrong');
      return {
        rows: Array.isArray(data) ? data : [],
        total: Number(headers?.['content-range']?.split('/')[1] ?? 0),
      };
    },
    enabled: enabled && !!tableId && viewIsForTable,
    // Keep the last page on screen while the next one loads, but never another table's or environment's rows:
    // they would render against this table's columns.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === environmentId && previousQuery?.queryKey[3] === tableId ? previous : undefined,
  });

  useEffect(() => {
    if (result.error) toast.error(result.error.message);
  }, [result.error]);

  return {
    rows: result.data?.rows ?? EMPTY_ROWS,
    total: result.data?.total ?? 0,
    // True only while there is nothing to show yet; a refetch behind kept rows is isFetching.
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
};

// Marks every cached page stale and refetches the one on screen, keeping the current view.
export const useInvalidateTableRows = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ROWS_KEY });
};

// Writes a saved cell into the cached pages of one table in one environment, so a cell save needs no refetch.
// Scoped by key: another table (or environment) can hold a row with the same primary key.
export const patchCachedRow = (
  queryClient: QueryClient,
  { environmentId, tableId }: { environmentId: string | null; tableId: string },
  isRow: (row: TableRow) => boolean,
  patch: Partial<TableRow>
) =>
  queryClient.setQueriesData<RowsPage>(
    { queryKey: [...ROWS_KEY, environmentId, tableId] },
    (page) => page && { ...page, rows: page.rows.map((row) => (isRow(row) ? { ...row, ...patch } : row)) }
  );
