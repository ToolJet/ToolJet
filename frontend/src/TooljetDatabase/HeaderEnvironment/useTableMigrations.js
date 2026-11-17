import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../context';
import { useTjdbStore } from '../_stores/tjdbStore';

/**
 * The open table's migration chain, plus which of it each environment has applied (null until loaded, and while no
 * table is open). Refetches when the table changes and whenever a migration is recorded (`migrationsVersion`).
 * `refetchTables` re-reads the table list for the per-environment `has_relation`: a promote creates a relation in a new
 * environment, and that has to be read again, not inferred client-side.
 */
export function useTableMigrations() {
  const { organizationId, selectedTable, setTables } = useContext(TooljetDatabaseContext);
  const migrationsVersion = useTjdbStore((state) => state.migrationsVersion);
  const [tableMigrations, setTableMigrations] = useState(null);
  // The org and table the last fetch was for, so a migrationsVersion bump can refetch without blanking the
  // migrations: only a real table or org change does.
  const tableKeyRef = useRef(null);
  const tableId = selectedTable?.id;

  const refetchTables = useCallback(() => {
    if (!organizationId) return;
    tooljetDatabaseService.findAll(organizationId).then(({ data, error }) => {
      if (error) return;
      setTables(data?.result ?? []);
    });
  }, [organizationId, setTables]);

  const fetchTableMigrations = useCallback(() => {
    if (!organizationId || !tableId) {
      setTableMigrations(null);
      return;
    }
    tooljetDatabaseService.getTableMigrations(organizationId, tableId).then(({ data, error }) => {
      if (error) return;
      setTableMigrations(data?.result ?? null);
    });
  }, [organizationId, tableId]);

  useEffect(() => {
    const tableKey = `${organizationId ?? ''}:${tableId ?? ''}`;
    if (tableKeyRef.current !== tableKey) {
      setTableMigrations(null);
      tableKeyRef.current = tableKey;
    }
    fetchTableMigrations();
    // migrationsVersion is intentionally not a fetchTableMigrations dependency: it only drives this effect, and must
    // not change the callback's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableMigrations, migrationsVersion]);

  return { tableMigrations, refetchTableMigrations: fetchTableMigrations, refetchTables };
}
