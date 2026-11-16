import React from 'react';

import { useDataTableRowReorder } from '@/pages/components/DataTable/Reorder';
import ItemRow from './ItemRow';

// A root row that can be dragged while it's pinned and reordering is allowed.
export default function SortableItemRow({ row }) {
  const { rowRef, dragHandle, isDragging } = useDataTableRowReorder(row);

  return <ItemRow row={row} rowRef={rowRef} dragHandle={dragHandle} isDragging={isDragging} />;
}
