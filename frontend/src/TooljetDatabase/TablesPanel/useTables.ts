import { useCallback, useEffect, useState } from 'react';
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

// Owns the page's table list: loads it, hands it to the open tabs (which restore or prune themselves), and keeps the
// open table's details merged in.
export function useTables() {
  const { organizationId, tables, selectedTable, setTables, setTablesLoaded, applyTables, setLoadingState } =
    useTooljetDatabaseContext();
  const [loading, setLoading] = useState(false);

  const fetchTables = useCallback(async () => {
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
    setTables(result);
    applyTables(result, takeTableDetailsHandoff());
  }, [organizationId, setLoadingState, applyTables, setTables, setTablesLoaded]);

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
