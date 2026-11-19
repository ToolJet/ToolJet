import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useReportUnsaved } from '../../_stores/unsavedChanges';
import { mapRowError } from '../../Table/Grid/inlineDraft';
import type { GridColumn } from '../../Table/Grid/useTableGrid';
import { RowFields } from './RowFields';
import { buildCreatePayload } from './rowRules';
import { useRowDraft } from './useRowDraft';

type CreateRowFormProps = {
  /** Called after the row was created. `keepOpen` is true for Shift + Enter: the drawer stays for another row. */
  onCreate: (keepOpen: boolean) => void;
  onClose: () => void;
};

// Create row (Figma "Create row drawer"). Enter creates and closes; Shift + Enter creates and starts a fresh row, with
// the footer counting what was added.
export function CreateRowForm({ onCreate, onClose }: CreateRowFormProps) {
  const { selectedTable, columns: tableColumns } = useTooljetDatabaseContext() as {
    selectedTable: { id: string };
    columns: GridColumn[];
  };
  const draft = useRowDraft(tableColumns, 'create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [added, setAdded] = useState(0);
  // "Any field changed", not "differs from the defaults": cleared when a fresh row starts.
  useReportUnsaved('createRow', draft.dirty);

  const submit = async (keepOpen: boolean) => {
    if (isSubmitting || draft.blocked) return;
    setIsSubmitting(true);
    const payload = buildCreatePayload(draft.columns, draft.states);
    const { error } = await tooljetDatabaseService.createRow(selectedTable.id, payload);
    setIsSubmitting(false);
    if (error) {
      const typed = Object.fromEntries(Object.entries(payload).map(([name, value]) => [name, String(value)]));
      const { errors, rowError } = mapRowError(error, draft.columns, typed);
      draft.setErrors(errors);
      toast.error(rowError ?? error?.message ?? 'Failed to create the row');
      return;
    }
    toast.success('Row created successfully');
    if (keepOpen) {
      setAdded((count) => count + 1);
      draft.reset();
    }
    onCreate(keepOpen);
  };

  const footerStart = (
    <p className="tw-m-0 tw-whitespace-pre-wrap tw-font-body-small tw-text-text-placeholder">
      {added > 0 && (
        <span className="tw-text-text-success" data-cy="rows-added-label">
          {`${added} ${added === 1 ? 'row' : 'rows'} added`}
          {'   '}
        </span>
      )}
      Shift + ⏎ Create row and add another
    </p>
  );

  return (
    <DrawerShell
      title="Create row"
      data-cy="create-new-row-header"
      onClose={onClose}
      footerStart={footerStart}
      submitLabel="Create row"
      submitDisabled={draft.blocked}
      isSubmitting={isSubmitting}
      onSubmit={() => submit(false)}
      onSubmitAndStay={() => submit(true)}
    >
      <RowFields
        key={draft.round}
        columns={draft.columns}
        kind="create"
        states={draft.states}
        errors={draft.errors}
        setField={draft.setField}
        setInvalid={draft.setInvalid}
      />
    </DrawerShell>
  );
}
