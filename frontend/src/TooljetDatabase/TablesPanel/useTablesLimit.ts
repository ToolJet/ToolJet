import { useEffect, useState } from 'react';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';

export interface TablesLimit {
  current?: number;
  total?: number;
}

// The workspace's table quota, read again whenever the table list changes.
export function useTablesLimit(tables: unknown[]) {
  const [limit, setLimit] = useState<TablesLimit>({});

  useEffect(() => {
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
  }, [tables]);

  const reached = limit.current !== undefined && limit.total !== undefined && limit.current >= limit.total;
  return { limit, reached };
}
