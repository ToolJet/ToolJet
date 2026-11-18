import React, { useMemo, useState } from 'react';
import Drawer from '@/_ui/Drawer';
import EditRowForm from '../../Forms/EditRowForm';
import { useGuardedClose } from '../../_stores/unsavedChanges';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import type { GridColumn, GridRow } from './useTableGrid';

type EditRowDrawerProps = {
  /** The row being edited; null closes the drawer. */
  row: GridRow | null;
  onClose: () => void;
  /** Called after a saved edit, once the rows have been refetched. */
  onEdited: () => void;
};

// The full row form (every column type, defaults, foreign key lookups) in a drawer. The form reads its starting values
// once, so it is remounted for each opening.
export function EditRowDrawer({ row, onClose, onEdited }: EditRowDrawerProps) {
  const { handleRefetchQuery, columns } = useTooljetDatabaseContext();
  const [referencedColumnDetails, setReferencedColumnDetails] = useState<unknown[]>([]);
  // Backdrop, Cancel and Escape ask about unsaved input; a save closes through `onEdited`, unasked.
  const requestClose = useGuardedClose('editRow', onClose);
  // Kept while the drawer slides out, when `row` is already null.
  const [shownRow, setShownRow] = useState(row);
  if (row && row !== shownRow) setShownRow(row);
  // Every column has a key (a missing value is null, which the form shows as NULL). Stable: the form reloads its
  // fields whenever this object changes.
  const values = useMemo(
    () =>
      shownRow
        ? Object.fromEntries((columns as GridColumn[]).map(({ accessor }) => [accessor, shownRow[accessor] ?? null]))
        : null,
    [shownRow, columns]
  );
  // Each opening is a new form, so a cancelled edit never comes back.
  const [session, setSession] = useState({ open: false, count: 0 });
  if (!!row !== session.open) setSession({ open: !!row, count: session.count + (row ? 1 : 0) });

  return (
    <Drawer isOpen={!!row} onClose={requestClose} position="right" drawerStyle={undefined} className="tj-db-drawer">
      {values && (
        <EditRowForm
          key={session.count}
          onEdit={() => {
            handleRefetchQuery();
            onEdited();
          }}
          onClose={requestClose}
          selectedRowObj={values}
          referencedColumnDetails={referencedColumnDetails}
          setReferencedColumnDetails={setReferencedColumnDetails}
          initiator="EditRowForm"
        />
      )}
    </Drawer>
  );
}
