import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useTooljetDatabaseContext, type TjdbTable } from '../TooljetDatabaseContext';

// The App Builder query editor opens the database page in a new tab with the table to show left in localStorage.
function takeTableDetailsHandoff(): TjdbTable | null {
  const stored = localStorage.getItem('tableDetails');
  if (!stored) return null;
  localStorage.removeItem('tableDetails');
  try {
    return JSON.parse(stored) as TjdbTable;
  } catch {
    return null;
  }
}

export interface FetchTablesOptions {
  /** Keep the table that is open now, if it still exists, instead of opening the first one. */
  keepOpenTable?: boolean;
}

// Owns the page's table list: loads it, decides which table is open, and keeps the open table's details merged in.
export function useTables() {
  const { organizationId, tables, selectedTable, setTables, setTablesLoaded, setSelectedTable, setLoadingState } =
    useTooljetDatabaseContext();
  const [loading, setLoading] = useState(false);

  const openTableRef = useRef(selectedTable);
  openTableRef.current = selectedTable;

  const fetchTables = useCallback(
    async ({ keepOpenTable = false }: FetchTablesOptions = {}) => {
      setLoading(true);
      setLoadingState(true);
      const { error, data } = await tooljetDatabaseService.findAll(organizationId);
      setLoading(false);
      setLoadingState(false);

      if (error) {
        toast.error(error?.message ?? 'Failed to fetch tables');
        return;
      }

      setTablesLoaded(true);
      const result: TjdbTable[] = data?.result ?? [];
      if (result.length === 0) {
        setTables([]);
        setSelectedTable({});
        return;
      }

      setTables(result);
      const handoff = takeTableDetailsHandoff();
      if (handoff) {
        setSelectedTable(handoff);
      } else if (!(keepOpenTable && result.some((table) => table.id === openTableRef.current.id))) {
        setSelectedTable({ table_name: result[0].table_name, id: result[0].id });
      }
    },
    [organizationId, setLoadingState, setSelectedTable, setTables, setTablesLoaded]
  );

  useEffect(() => {
    fetchTables();
    // Once, on mount: later reloads are asked for explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `selectedTable` is only ever the thin { id, table_name } shape (a rename sets it), while a list row also carries
  // `environments`, which the header's environment select reads. Merge, don't replace.
  useEffect(() => {
    setTables((previous) => {
      const list = previous as TjdbTable[];
      if (!list.some((table) => table.id === selectedTable.id)) return previous;
      return list.map((table) => (table.id === selectedTable.id ? { ...table, ...selectedTable } : table));
    });
  }, [selectedTable, setTables]);

  return { tables: tables as TjdbTable[], loading, refetch: fetchTables };
}
