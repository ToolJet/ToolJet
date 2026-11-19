import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { CHANGE_TYPE } from '../../MigrationConfirmModal';
import useMigrationModal from '../../MigrationConfirmModal/useMigrationModal';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useReportUnsaved } from '../../_stores/unsavedChanges';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { RelationList } from '../TableDrawer/RelationList';
import { ColumnFields } from './ColumnFields';
import { relationBlockedReason, useColumnDraft } from './useColumnDraft';

type RunMigration = (options: {
  defaultTitle: string;
  changes: { type: string; name: string; detail?: string }[];
  tableId: string;
  showSqlEditor: boolean;
  run: (migrationName: string) => Promise<unknown>;
  onSuccess: () => void;
}) => void;

type AddColumnFormProps = {
  /** Called once the column is added. */
  onCreate: () => void;
  /** Closes, asking about unsaved input first. */
  onCancel: () => void;
};

// A new column of the open table: its fields, and (in the draft) the one foreign key it may have. Both go to the server
// together, through the migration confirmation.
export function AddColumnForm({ onCreate, onCancel }: AddColumnFormProps) {
  const { organizationId, selectedTable, columns } = useTooljetDatabaseContext() as unknown as {
    organizationId: string;
    selectedTable: { id: string; table_name: string };
    columns: { Header: string }[];
  };
  const otherNames = useMemo(() => (columns ?? []).map((column) => column.Header), [columns]);
  const draft = useColumnDraft(otherNames);
  const { runMigration, modal } = useMigrationModal() as unknown as {
    runMigration: RunMigration;
    modal: React.ReactNode;
  };
  // Once added the draft is the column; the drawer stays mounted while it slides out.
  const [isSaved, setIsSaved] = useState(false);
  useReportUnsaved('createColumn', draft.isDirty && !isSaved);
  // A toast left over from the page would sit over the footer.
  useEffect(() => {
    toast.dismiss();
  }, []);

  const submit = () => {
    const payload = draft.toPayload();
    runMigration({
      defaultTitle: `Add column "${payload.columnName}"`,
      changes: [
        {
          type: CHANGE_TYPE.ADD,
          name: payload.columnName,
          detail: payload.defaultValue ? `${payload.dataType} · default ${payload.defaultValue}` : payload.dataType,
        },
      ],
      tableId: selectedTable.id,
      showSqlEditor: true,
      run: (migrationName) =>
        tooljetDatabaseService.createColumn(
          organizationId,
          selectedTable.table_name,
          payload.columnName,
          payload.dataType,
          payload.defaultValue,
          payload.isNotNull,
          payload.isUnique,
          payload.isSerial,
          payload.checkingValues,
          payload.foreignKeyDetails,
          payload.configurations,
          migrationName
        ),
      onSuccess: () => {
        setIsSaved(true);
        toast.success('Column created successfully');
        onCreate();
      },
    });
  };

  return (
    <>
      <DrawerShell
        title="Add column"
        data-cy="create-new-column-header"
        onClose={onCancel}
        submitLabel="Add column"
        submitDisabled={!draft.canSubmit}
        onSubmit={submit}
      >
        <div className="tw-flex tw-flex-col tw-gap-4">
          <ColumnFields draft={draft} otherNames={otherNames} defaultRelations={draft.relations} />
          <Separator />
          <RelationList
            tableName={selectedTable.table_name}
            draft={draft}
            forColumn={{
              name: draft.column.column_name,
              addDisabledReason: relationBlockedReason(draft.column, otherNames),
            }}
          />
        </div>
      </DrawerShell>
      {modal}
    </>
  );
}
