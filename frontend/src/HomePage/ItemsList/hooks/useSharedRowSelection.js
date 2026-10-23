import { useCallback } from 'react';

import { getSelectedKind, useItemsListStore } from '../store/itemsListStore';

// Table options that bind a TanStack table to the store's shared selection and enforce one kind at a time.
export function useSharedRowSelection() {
  const rowSelection = useItemsListStore((state) => state.rowSelection);
  const setRowSelection = useItemsListStore((state) => state.setRowSelection);
  const selectedKind = getSelectedKind(rowSelection);

  const enableRowSelection = useCallback((row) => !selectedKind || row.original.kind === selectedKind, [selectedKind]);

  return { rowSelection, onRowSelectionChange: setRowSelection, enableRowSelection };
}
