import { useCallback, useState } from 'react';
import { functionalUpdate, type OnChangeFn, type RowSelectionState } from '@tanstack/react-table';
import { useRowsViewKey } from '../../rows/useTableRows';

const NO_ROWS: RowSelectionState = {};

// Selection belongs to the page of rows on screen. It is stored with that page's view key and dropped, during render,
// the moment the key changes, so no caller has to clear it and a stale selection never paints. Returning to an
// earlier page does not bring the old selection back.
export const useRowSelection = () => {
  const viewKey = useRowsViewKey();
  const [selection, setSelection] = useState({ key: viewKey, ids: NO_ROWS });

  if (selection.key !== viewKey) setSelection({ key: viewKey, ids: NO_ROWS });
  const rowSelection = selection.key === viewKey ? selection.ids : NO_ROWS;

  const onRowSelectionChange = useCallback<OnChangeFn<RowSelectionState>>(
    (updater) =>
      setSelection((current) => ({
        key: viewKey,
        ids: functionalUpdate(updater, current.key === viewKey ? current.ids : NO_ROWS),
      })),
    [viewKey]
  );

  const clearSelection = useCallback(() => setSelection({ key: viewKey, ids: NO_ROWS }), [viewKey]);

  return { rowSelection, onRowSelectionChange, clearSelection };
};
