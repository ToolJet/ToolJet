import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/_components/ConfirmDialog';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { LinkButton } from '@/components/ui/Rocket/LinkButton/LinkButton';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { useInvalidateTableRows } from '../../rows/useTableRows';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { deleteRowsByPrimaryKey } from './deleteRows';
import type { GridRow } from './useTableGrid';

type SelectionBarProps = {
  rows: GridRow[];
  primaryKeys: string[];
  canSelectRows: boolean;
  /** Why Delete is off, when it is. */
  deleteBlockedReason?: string;
  onClear: () => void;
};

// Floats over the bottom of the grid while rows are selected. Delete is the only bulk action; Edit (one row) waits
// for the row drawer.
export function SelectionBar({ rows, primaryKeys, canSelectRows, deleteBlockedReason, onClear }: SelectionBarProps) {
  const { selectedTable } = useTooljetDatabaseContext();
  const invalidateRows = useInvalidateTableRows();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Without the permission the checkboxes are off, but a selection made before it was lost must not stay actionable.
  if (!canSelectRows || rows.length === 0) return null;

  const confirmDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);
    const deleted = await deleteRowsByPrimaryKey({
      tableId: selectedTable.id ?? '',
      tableName: selectedTable.table_name ?? '',
      primaryKeys,
      rows,
    });
    setIsDeleting(false);
    if (!deleted) return;
    invalidateRows();
    onClear();
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="Selected rows"
        data-cy="selection-bar"
        className="tw-absolute tw-bottom-3 tw-left-1/2 tw-z-40 tw-flex -tw-translate-x-1/2 tw-items-center tw-gap-3 tw-whitespace-nowrap tw-rounded-large tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-px-4 tw-py-2 tw-shadow-elevation-400"
      >
        <span aria-live="polite" className="tw-font-body-large tw-text-text-default">
          {rows.length} {rows.length === 1 ? 'row' : 'rows'} selected
        </span>
        <LinkButton onClick={onClear}>Clear</LinkButton>
        <Separator orientation="vertical" className="tw-h-4" />
        <span title={deleteBlockedReason}>
          <Button
            variant="secondary"
            danger
            leadingVisual={<Trash2 />}
            disabled={!!deleteBlockedReason || isDeleting}
            onClick={() => setIsConfirmOpen(true)}
            data-cy="delete-row-records-button"
          >
            Delete
          </Button>
        </span>
      </div>
      <ConfirmDialog
        title="Delete rows"
        show={isConfirmOpen}
        message="Are you sure you want to delete the selected rows?"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        onCloseIconClick={() => setIsConfirmOpen(false)}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
}
