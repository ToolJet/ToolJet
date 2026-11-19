import { useCallback, useState } from 'react';
import { useRowsViewKey } from '../../rows/useTableRows';
import { cellNavigationReducer, type CellNavAction, type CellNavState } from './cellNavigation';

type Bounds = { rowCount: number; columnIds: readonly string[] };

// The focused cell belongs to the page of rows on screen, like a row selection: it is stored with the view key and
// dropped, during render, the moment the key changes. A refetch under the same key keeps it, so a delete can leave it
// past the last row (or on a column that is gone); it reads as no focus until it is valid again.
export const useCellNavigation = ({ rowCount, columnIds }: Bounds) => {
  const viewKey = useRowsViewKey();
  const [stored, setStored] = useState<{ key: string; cell: CellNavState }>({ key: viewKey, cell: null });

  if (stored.key !== viewKey) setStored({ key: viewKey, cell: null });
  const current = stored.key === viewKey ? stored.cell : null;
  const cell = current && current.rowIndex < rowCount && columnIds.includes(current.columnId) ? current : null;

  const dispatch = useCallback(
    (action: CellNavAction) =>
      setStored((previous) => ({
        key: viewKey,
        cell: cellNavigationReducer(previous.key === viewKey ? previous.cell : null, action),
      })),
    [viewKey]
  );

  return { cell, dispatch };
};
