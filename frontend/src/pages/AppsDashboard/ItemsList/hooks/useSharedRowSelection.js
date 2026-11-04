import { useCallback } from 'react';

import { useAppsStore } from '@/_stores/appsStore';
import { getSelectedKind } from '@/pages/AppsDashboard/items';

// Table options that bind a TanStack table to the store's shared selection and enforce one kind at a time.
export function useSharedRowSelection() {
  const rowSelection = useAppsStore((state) => state.rowSelection);
  const setRowSelection = useAppsStore((state) => state.setRowSelection);
  const selectedKind = getSelectedKind(rowSelection);

  const enableRowSelection = useCallback((row) => !selectedKind || row.original.kind === selectedKind, [selectedKind]);

  return { rowSelection, onRowSelectionChange: setRowSelection, enableRowSelection };
}
