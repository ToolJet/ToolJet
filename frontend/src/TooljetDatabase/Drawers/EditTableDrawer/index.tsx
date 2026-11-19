import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import Drawer from '@/_ui/Drawer';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import ChangesComponent from '../../ChangesComponent';
import useMigrationModal from '../../MigrationConfirmModal/useMigrationModal';
import { TableSchemaScope } from '../../TableActions/TableSchemaScope';
import type { TableColumn } from '../../TableActions/editTableFormData';
import { useTooljetDatabaseContext, type TjdbTable } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { useGuardedClose, useReportUnsaved } from '../../_stores/unsavedChanges';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { FooterNote } from '../TableDrawer/FooterNote';
import { RelationList } from '../TableDrawer/RelationList';
import { SchemaTable } from '../TableDrawer/SchemaTable';
import { SectionHeader } from '../TableDrawer/SectionHeader';
import { TableNameField } from '../TableDrawer/TableNameField';
import { buildEditColumns, buildEditRelations, describeEditChanges } from '../TableDrawer/editTableRules';
import { useTableDraft } from '../TableDrawer/useTableDraft';
import { useLiveRelations } from './useLiveRelations';

const DOCS = 'https://docs.tooljet.com/docs/tooljet-db/table-operations#rename-table';

export interface EditTableDrawerProps {
  table: TjdbTable;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the table as it is named now, once the edit is saved. */
  onRenamed: (table: TjdbTable) => void;
}

type RunMigration = (options: {
  defaultTitle: string;
  changes: { type: 'add' | 'edit' | 'remove'; name: string; oldName?: string }[];
  tableId: string;
  showSqlEditor: boolean;
  banner?: React.ReactNode;
  run: (migrationName: string) => Promise<unknown>;
  onSuccess: () => void;
}) => void;

type StoredRelations = Parameters<typeof buildEditRelations>[0];

// While the schema loads the drawer already shows its header and footer: the focus trap around it needs a focusable
// element from the first render, and the close button gives it one.
const DrawerLoading = ({ onClose }: { onClose: () => void }) => (
  <DrawerShell title="Edit table" onClose={onClose} submitLabel="Save changes" submitDisabled onSubmit={() => {}}>
    <div className="tw-flex tw-flex-col tw-gap-3">
      <Skeleton className="tw-h-6 tw-w-1/3" />
      <Skeleton className="tw-h-10 tw-w-full" />
      <Skeleton className="tw-h-10 tw-w-full" />
    </div>
  </DrawerShell>
);

type EditTableFormProps = {
  table: TjdbTable;
  onRenamed: (table: TjdbTable) => void;
  /** Closes without asking: the edit is saved. */
  onClose: () => void;
  /** Closes, asking about unsaved input first. */
  onCancel: () => void;
};

// Runs inside TableSchemaScope, so the context describes `table` whichever table the grid has open.
function EditTableForm({ table, onRenamed, onClose, onCancel }: EditTableFormProps) {
  const context = useTooljetDatabaseContext();
  const { fetchTableMetadata, resetView } = useTjdbActions();
  const {
    organizationId,
    tables,
    columns: stored,
    configurations,
    foreignKeys,
  } = context as unknown as {
    organizationId: string;
    tables: TjdbTable[];
    columns: TableColumn[];
    configurations: Record<string, unknown>;
    foreignKeys: StoredRelations;
  };
  // The table's own name is not "taken" by itself.
  const otherNames = useMemo(
    () => (tables ?? []).filter((item) => item.id !== table.id).map((item) => item.table_name),
    [tables, table.id]
  );
  const initial = useMemo(
    () => ({
      tableName: table.table_name,
      columns: buildEditColumns(stored, configurations),
      relations: buildEditRelations(foreignKeys ?? []),
    }),
    // The draft reads this once; later changes to the context are folded in by the actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const draft = useTableDraft(otherNames, initial);
  const { runMigration, modal } = useMigrationModal() as unknown as {
    runMigration: RunMigration;
    modal: React.ReactNode;
  };
  const live = useLiveRelations(table, draft);
  // Once saved the draft is the table; the drawer stays mounted while it slides out.
  const [isSaved, setIsSaved] = useState(false);
  useReportUnsaved('editTable', draft.isDirty && !isSaved);

  // The scope's context is this table's own: the page sees these writes only when the table is the open one.
  const handleSaved = (tableName: string) => {
    fetchTableMetadata(organizationId, tableName).then(
      (
        metadata: { configurations: Record<string, unknown>; columns: TableColumn[]; foreignKeys: unknown[] } | null
      ) => {
        if (!metadata) return;
        context.setConfigurations(metadata.configurations);
        if (metadata.columns.length > 0) context.setColumns(metadata.columns);
        context.setForeignKeys([...metadata.foreignKeys]);
      }
    );
    // The edit can rename or drop columns, so the saved filters and sort of this table may name one that is gone.
    resetView(table.id);
    context.handleRefetchQuery();
    onRenamed({ ...table, table_name: tableName });
    onClose();
  };

  const submit = () => {
    const entries = draft.toEditPayload();
    const { primaryKeyChange } = draft;
    runMigration({
      defaultTitle: `Edit table "${table.table_name}"`,
      changes: [
        ...(draft.tableName !== table.table_name
          ? [{ type: 'edit' as const, oldName: table.table_name, name: draft.tableName }]
          : []),
        ...describeEditChanges(draft.columns, initial.columns),
      ],
      tableId: table.id,
      showSqlEditor: true,
      // The old primary key is dropped and the new one added: said once, in the confirmation.
      banner: primaryKeyChange ? (
        <div className="tw-mb-3">
          <div className="tw-font-title-default tw-text-text-default">Change in primary key</div>
          <div className="tw-mb-2 tw-font-body-default tw-text-text-placeholder">
            Updating the table will drop the current primary key constraints and add the new one. This action cannot be
            reversed.
          </div>
          <ChangesComponent
            currentPrimaryKeyIcons={primaryKeyChange.current as never}
            newPrimaryKeyIcons={primaryKeyChange.next as never}
          />
        </div>
      ) : null,
      run: (migrationName) =>
        tooljetDatabaseService.renameTable(organizationId, table.table_name, draft.tableName, entries, migrationName),
      onSuccess: () => {
        setIsSaved(true);
        toast.success(`${draft.tableName} updated successfully`);
        handleSaved(draft.tableName);
      },
    });
  };

  return (
    <>
      <DrawerShell
        title="Edit table"
        data-cy="edit-table-header"
        onClose={onCancel}
        footerStart={<FooterNote>Queries and apps using this table aren’t updated automatically.</FooterNote>}
        submitLabel="Save changes"
        submitDataCy="save-changes-button"
        submitDisabled={!draft.canSubmit || !draft.isDirty}
        onSubmit={submit}
      >
        <div className="tw-flex tw-flex-col tw-gap-6">
          <TableNameField value={draft.tableName} onChange={draft.setTableName} existingNames={otherNames} />
          <section className="tw-flex tw-flex-col tw-gap-4">
            <SectionHeader
              title="Table schema"
              description="Define the columns in this table: their names, data types, default values and constraints."
              docsHref={DOCS}
              data-cy="add-columns-header"
              action={
                <Button
                  variant="ghostBrand"
                  size="medium"
                  leadingVisual={<Plus />}
                  onClick={draft.addColumn}
                  data-cy="add-more-columns-button"
                >
                  Add column
                </Button>
              }
            />
            <SchemaTable draft={draft} reorderable={false} />
          </section>
          <RelationList
            tableName={table.table_name}
            draft={draft}
            actions={live.actions}
            sourceColumns={initial.columns}
          />
        </div>
      </DrawerShell>
      {live.modal}
      {modal}
    </>
  );
}

// Controlled like the Create drawer: whoever has an Edit action owns the open state.
export default function EditTableDrawer({ table, isOpen, onClose, onRenamed }: EditTableDrawerProps) {
  const requestClose = useGuardedClose('editTable', onClose);

  return (
    <Drawer
      // The migration confirmation opens above this drawer; a focus trap here would keep it from taking focus.
      disableFocus
      isOpen={isOpen}
      onClose={requestClose}
      position="right"
      drawerStyle={{ width: '880px' }}
      className="tj-db-drawer"
    >
      <TableSchemaScope table={table} fallback={<DrawerLoading onClose={requestClose} />} onError={onClose}>
        <EditTableForm table={table} onRenamed={onRenamed} onClose={onClose} onCancel={requestClose} />
      </TableSchemaScope>
    </Drawer>
  );
}
