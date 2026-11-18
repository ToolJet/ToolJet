import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useTjdbStore } from '../_stores/tjdbStore';

const PAGE_SIZE = 50;

type Args = {
  tableId: string;
  column: string;
  /** Text columns match by substring, the rest by equality. */
  isTextColumn: boolean;
  search: string;
};

// The first page of the values a foreign key column can take, from the referenced table in the selected environment.
// A search narrows it on the server, so a value past the first page is still reachable by typing it.
export const useForeignKeyValues = ({ tableId, column, isTextColumn, search }: Args) => {
  const environmentId = useTjdbStore(
    (state: { selectedEnvironment: { id: string } | null }) => state.selectedEnvironment?.id ?? null
  );

  const result = useQuery<string[], Error>({
    queryKey: ['tjdb', 'foreign-key-values', environmentId, tableId, column, isTextColumn, search],
    queryFn: async () => {
      const params = new URLSearchParams({ select: column, limit: String(PAGE_SIZE) });
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
    placeholderData: keepPreviousData,
  });

  return { values: result.data ?? [], isLoading: result.isLoading, isError: result.isError };
};
