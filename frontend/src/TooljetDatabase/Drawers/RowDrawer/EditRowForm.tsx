import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { listAllPrimaryKeyColumns } from '../../constants';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useReportUnsaved } from '../../_stores/unsavedChanges';
import { buildRowFilter, hasExactKeyValues } from '../../Table/Grid/cellEditing';
import { mapRowError } from '../../Table/Grid/inlineDraft';
import type { GridColumn, GridRow } from '../../Table/Grid/useTableGrid';
import { RowFields } from './RowFields';
import { buildEditPayload } from './rowRules';
import { useRowDraft } from './useRowDraft';

type EditRowFormProps = {
  /** The row as the grid holds it: raw stored values, one entry per column. */
  row: GridRow;
  /** Called after the row was saved. */
  onEdit: () => void;
  onClose: () => void;
};

// Edit row (Figma "Edit row drawer"): the same fields, filled from the row. Keys are read-only, and Save sends only
// what changed.
export function EditRowForm({ row, onEdit, onClose }: EditRowFormProps) {
  const { selectedTable, columns: tableColumns } = useTooljetDatabaseContext() as {
    selectedTable: { id: string };
    columns: GridColumn[];
  };
  const draft = useRowDraft(tableColumns, 'edit', row);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useReportUnsaved('editRow', draft.dirty);

  const submit = async () => {
    if (isSubmitting || draft.blocked || !draft.dirty) return;
    // Without every key value there is no filter to send, and a PATCH without one would rewrite every row.
    const keys: string[] = listAllPrimaryKeyColumns(tableColumns);
    if (keys.length === 0 || keys.some((key) => row[key] == null) || !hasExactKeyValues(keys, row)) {
      toast.error('Something went wrong - Record Id is incorrect');
      return;
    }
    setIsSubmitting(true);
    const payload = buildEditPayload(draft.columns, draft.states, draft.initial);
    const { error } = await tooljetDatabaseService.updateRows(selectedTable.id, payload, buildRowFilter(keys, row));
    setIsSubmitting(false);
    if (error) {
      const typed = Object.fromEntries(Object.entries(payload).map(([name, value]) => [name, String(value)]));
      const { errors, rowError } = mapRowError(error, draft.columns, typed);
      draft.setErrors(errors);
      toast.error(rowError ?? error?.message ?? 'Failed to edit the row');
      return;
    }
    toast.success('Row edited successfully');
    onEdit();
  };

  return (
    <DrawerShell
      title="Edit row"
      data-cy="edit-row-header"
      onClose={onClose}
      submitLabel="Save changes"
      submitDataCy="save-changes-button"
      submitDisabled={draft.blocked || !draft.dirty}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    >
      <RowFields
        columns={draft.columns}
        kind="edit"
        states={draft.states}
        errors={draft.errors}
        row={row}
        setField={draft.setField}
        setInvalid={draft.setInvalid}
      />
    </DrawerShell>
  );
}
