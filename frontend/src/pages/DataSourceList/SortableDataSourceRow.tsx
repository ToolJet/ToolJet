import React from 'react';
import type { Row } from '@tanstack/react-table';

import { useDataTableRowReorder } from '@/pages/components/DataTable/Reorder';

import DataSourceRow from './DataSourceRow';
import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';

// A root row that can be dragged while it's pinned and reordering is allowed.
export default function SortableDataSourceRow({ row }: { row: Row<DataSourceListItem> }) {
  const { rowRef, dragHandle, isDragging } = useDataTableRowReorder(row);

  return <DataSourceRow row={row} rowRef={rowRef} dragHandle={dragHandle} isDragging={isDragging} />;
}
