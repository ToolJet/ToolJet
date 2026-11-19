import React from 'react';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import useMigrationModal from '../../MigrationConfirmModal/useMigrationModal';
import ChangesComponent from '../../ChangesComponent';
import { useTooljetDatabaseContext, type TjdbTable } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { buildEditRelations } from '../TableDrawer/editTableRules';
import type { RelationActions } from '../TableDrawer/RelationList';
import type { DraftRelation, RelationPayload } from '../TableDrawer/types';
import type { useTableDraft } from '../TableDrawer/useTableDraft';

type Change = { type: 'add' | 'edit' | 'remove'; name: string; detail?: string };
type RunMigration = (options: {
  titlePlaceholder: string;
  changes: Change[];
  tableId: string;
  showSqlEditor: boolean;
  banner?: React.ReactNode;
  run: (migrationName: string) => Promise<{ error?: { message?: string } } | undefined>;
  onSuccess: () => void;
}) => void;

type StoredRelation = Parameters<typeof buildEditRelations>[0][number];

// The server takes the relation without the target table's id.
const toServerRelation = ({
  column_names,
  referenced_table_name,
  referenced_column_names,
  on_delete,
  on_update,
}: RelationPayload) => ({
  column_names,
  referenced_table_name,
  referenced_column_names,
  on_delete,
  on_update,
});

const describe = (relation: RelationPayload) =>
  `${relation.column_names[0]} → ${relation.referenced_table_name}.${relation.referenced_column_names[0]}`;

/**
 * A stored table saves its foreign keys one at a time, each through the migration confirmation, not with the rest of
 * the edit. Returns the actions for the relation list and the modal to render once.
 */
export function useLiveRelations(table: TjdbTable, draft: ReturnType<typeof useTableDraft>) {
  const { organizationId, setForeignKeys, handleRefetchQuery } = useTooljetDatabaseContext() as {
    organizationId: string;
    setForeignKeys: (relations: unknown[]) => void;
    handleRefetchQuery: () => void;
  };
  const { fetchTableMetadata } = useTjdbActions();
  const { runMigration, modal } = useMigrationModal() as unknown as {
    runMigration: RunMigration;
    modal: React.ReactNode;
  };
  // Always the saved name: a rename in the form has not reached the server yet.
  const tableName = table.table_name;

  const refresh = async () => {
    const metadata = (await fetchTableMetadata(organizationId, tableName)) as { foreignKeys: StoredRelation[] } | null;
    if (!metadata) return;
    setForeignKeys([...metadata.foreignKeys]);
    draft.replaceRelations(buildEditRelations(metadata.foreignKeys));
    handleRefetchQuery();
  };

  const actions: RelationActions = {
    add: (relation, done) =>
      runMigration({
        titlePlaceholder: `Add foreign key on "${tableName}"`,
        changes: [{ type: 'add', name: tableName, detail: describe(relation) }],
        tableId: table.id,
        showSqlEditor: true,
        run: (migrationName) =>
          tooljetDatabaseService.createForeignKey(
            organizationId,
            tableName,
            [toServerRelation(relation)],
            migrationName
          ),
        onSuccess: async () => {
          await refresh();
          toast.success('Foreign key created successfully');
          done();
        },
      }),

    update: (relation: DraftRelation, next, done) => {
      const targetChanged =
        relation.referenced_table_name !== next.referenced_table_name ||
        relation.referenced_column_names[0] !== next.referenced_column_names[0];
      runMigration({
        titlePlaceholder: `Edit foreign key on "${tableName}"`,
        changes: [{ type: 'edit', name: tableName, detail: describe(next) }],
        tableId: table.id,
        showSqlEditor: true,
        banner: targetChanged ? (
          <div className="tw-mb-3">
            <div className="tw-font-title-default tw-text-text-default">Change in foreign key relation</div>
            <div className="tw-mb-2 tw-font-body-default tw-text-text-placeholder">
              Updating the foreign key relation will drop the current constraint and add the new one. This will also
              replace the default value set in the target table columns with those of the source table.
            </div>
            <ChangesComponent
              foreignKeyChanges={[{}]}
              existingReferencedTableName={relation.referenced_table_name}
              existingReferencedColumnName={relation.referenced_column_names[0]}
              currentReferencedTableName={next.referenced_table_name}
              currentReferencedColumnName={next.referenced_column_names[0]}
            />
          </div>
        ) : null,
        run: (migrationName) =>
          tooljetDatabaseService.editForeignKey(
            organizationId,
            tableName,
            relation.constraint_name,
            [toServerRelation(next)],
            migrationName
          ),
        onSuccess: async () => {
          await refresh();
          toast.success('Foreign key edited successfully');
          done();
        },
      });
    },

    remove: (relation: DraftRelation) =>
      runMigration({
        titlePlaceholder: `Remove foreign key on "${tableName}"`,
        changes: [{ type: 'remove', name: tableName, detail: describe(relation) }],
        tableId: table.id,
        showSqlEditor: false,
        banner: (
          <div className="tw-mb-3 tw-font-body-default tw-text-text-placeholder">
            Deleting the foreign key relation cannot be reversed.
          </div>
        ),
        run: (migrationName) =>
          tooljetDatabaseService.deleteForeignKey(organizationId, tableName, relation.constraint_name, migrationName),
        onSuccess: async () => {
          await refresh();
          toast.success('Foreign key deleted successfully');
        },
      }),
  };

  return { actions, modal };
}
