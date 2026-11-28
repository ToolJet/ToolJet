import { useEffect, useState } from 'react';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';

export interface TablesLimit {
  current?: number;
  total?: number;
}

// The workspace's table quota. Call it once per page and share the result (context), not once per consumer.
// It is read again only when the number of tables changes (a create or a delete): renames and tab switches also hand
// out a new `tables` array, and must not cost a request. Waits for the first list load, `enabled`, so the empty list
// before it does not cost one either.
export function useTablesLimit(tableCount: number, enabled = true) {
  const [limit, setLimit] = useState<TablesLimit>({});

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    tooljetDatabaseService
      .getTablesLimit()
      .then((response: { data?: { tablesCount?: TablesLimit } }) => {
        if (!cancelled) setLimit(response?.data?.tablesCount ?? {});
      })
      .catch((error: unknown) => console.error('Error fetching tables limit:', error));
    return () => {
      cancelled = true;
    };
  }, [tableCount, enabled]);

  const reached = limit.current !== undefined && limit.total !== undefined && limit.current >= limit.total;
  return { limit, reached };
}
