import { useCallback } from 'react';
import type { Row } from '@tanstack/react-table';

import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';

import { getSelectedKind } from '../selection';

// Table options that bind a TanStack table (root or folder) to the store's shared selection, one kind at a time.
export function useDataSourceRowSelection() {
  const rowSelection = useDataSourcesDashboardStore((state) => state.rowSelection);
  const setRowSelection = useDataSourcesDashboardStore((state) => state.setRowSelection);
  const selectedKind = getSelectedKind(rowSelection);

  const enableRowSelection = useCallback(
    (row: Row<DataSourceListItem>) => !selectedKind || row.original.kind === selectedKind,
    [selectedKind]
  );

  return { rowSelection, onRowSelectionChange: setRowSelection, enableRowSelection };
}
