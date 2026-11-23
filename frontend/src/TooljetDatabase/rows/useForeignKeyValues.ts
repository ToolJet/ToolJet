import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useTjdbStore } from '../_stores/tjdbStore';

export const FOREIGN_KEY_PAGE_SIZE = 50;

/** True when a scrollable list is within a few rows of its end: the moment to ask for the next page. */
export const isNearListEnd = (list: HTMLElement) => list.scrollHeight - list.scrollTop - list.clientHeight < 48;

type Args = {
  tableId: string;
  column: string;
  /** Text columns match by substring, the rest by equality. */
  isTextColumn: boolean;
  search: string;
  /** Off until the referenced table is known. */
  enabled?: boolean;
};

// The values a foreign key column can take, from the referenced table in the selected environment, 50 at a time:
// `fetchNextPage` appends the next 50. A search narrows the list on the server, so typing a value reaches it at once.
// The order is fixed, or the offsets would not line up from one page to the next.
export const useForeignKeyValues = ({ tableId, column, isTextColumn, search, enabled = true }: Args) => {
  const environmentId = useTjdbStore(
    (state: { selectedEnvironment: { id: string } | null }) => state.selectedEnvironment?.id ?? null
  );

  const result = useInfiniteQuery<string[], Error, { pages: string[][] }, unknown[], number>({
    queryKey: ['tjdb', 'foreign-key-values', environmentId, tableId, column, isTextColumn, search],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        select: column,
        limit: String(FOREIGN_KEY_PAGE_SIZE),
        offset: String(pageParam),
      });
      if (search) params.append(column, isTextColumn ? `ilike.%${search}%` : `eq.${search}`);
      params.append(column, 'not.is.null');
      params.append('order', `${column}.asc`);

      const { data, error } = await tooljetDatabaseService.findOne(
        tableId,
        params.toString(),
        environmentId ?? undefined
      );
      if (error) throw new Error(error?.message ?? 'Something went wrong');
      return Array.isArray(data) ? data.map((row: Record<string, unknown>) => String(row[column])) : [];
    },
    // A short page is the last one.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === FOREIGN_KEY_PAGE_SIZE ? allPages.length * FOREIGN_KEY_PAGE_SIZE : undefined,
    placeholderData: keepPreviousData,
    enabled,
  });

  return {
    values: result.data?.pages.flat() ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
    fetchNextPage: result.fetchNextPage,
  };
};
