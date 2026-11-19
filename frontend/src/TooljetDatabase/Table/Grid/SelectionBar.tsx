import React, { useState } from 'react';
import { Pencil, Trash, Trash2 } from 'lucide-react';
import ActionDialog from '@/components/ui/Rocket/Dialog/ActionDialog';
import { DialogDescription, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
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
  /** Opens the edit row drawer. Edit is one row only. */
  onEdit: () => void;
  /** Why Edit is off, when it is (more than one row, or a row that cannot be matched safely). */
  editBlockedReason?: string;
  onClear: () => void;
};

// Floats over the bottom of the grid while rows are selected: Edit (one row at a time) and Delete.
export function SelectionBar({
  rows,
  primaryKeys,
  canSelectRows,
  deleteBlockedReason,
  onEdit,
  editBlockedReason,
  onClear,
}: SelectionBarProps) {
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
        <span title={editBlockedReason}>
          <Button
            variant="secondary"
            leadingVisual={<Pencil />}
            disabled={!!editBlockedReason}
            onClick={onEdit}
            data-cy="edit-row-button"
          >
            Edit
          </Button>
        </span>
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
      {/* Same dialog as Delete constants in workspace settings. */}
      <ActionDialog
        open={isConfirmOpen}
        handleOpenChange={setIsConfirmOpen}
        classes={{ dialogContent: 'tw-max-w-[459px] tw-border-0', dialogBody: 'tw-pb-0' }}
        cancelBtnProps={{ onClick: () => setIsConfirmOpen(false), 'data-cy': 'cancel-button' }}
        submitActions={[
          {
            label: rows.length === 1 ? 'Delete row' : 'Delete rows',
            variant: 'dangerPrimary',
            onClick: confirmDelete,
            'data-cy': 'delete-rows-confirm-button',
          },
        ]}
      >
        <div className="tw-flex tw-flex-col tw-gap-2">
          <Trash size={40} className="tw-text-icon-danger" />
          <div className="tw-flex tw-flex-col tw-gap-0.5">
            <DialogTitle className="tw-font-title-x-large tw-text-text-default">
              {rows.length === 1 ? 'Delete row?' : `Delete ${rows.length} rows?`}
            </DialogTitle>
            <DialogDescription className="tw-mb-0 tw-font-body-default tw-text-text-default">
              {rows.length === 1
                ? 'The selected row will be permanently deleted, do you want to continue?'
                : `The ${rows.length} selected rows will be permanently deleted, do you want to continue?`}
            </DialogDescription>
          </div>
        </div>
      </ActionDialog>
    </>
  );
}
