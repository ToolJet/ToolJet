import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CircleAlert, KeyRound } from 'lucide-react';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { Tag } from '@/components/ui/Rocket/Tag/Tag';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { getLocalTimeZone } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import { allowedTargets, blockedReason, ALWAYS_BLOCKED_REASONS, inconsistentRowsFilter } from '../../columnTypeChange';
import { dataTypes } from '../../constants';
import { typeChangeDetail } from '../../MigrationConfirmModal';
import useMigrationModal from '../../MigrationConfirmModal/useMigrationModal';
import { useTooljetDatabaseContext, type TjdbTable } from '../../TooljetDatabaseContext';
import { useTjdbActions, useTjdbStore } from '../../_stores/tjdbStore';
import { useReportUnsaved } from '../../_stores/unsavedChanges';
import { useLiveRelations } from '../EditTableDrawer/useLiveRelations';
import { buildEditColumns, buildEditRelations } from '../TableDrawer/editTableRules';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { FooterNote } from '../TableDrawer/FooterNote';
import { RelationList } from '../TableDrawer/RelationList';
import { CastNotice } from './CastNotice';
import { ColumnFields } from './ColumnFields';
import { planColumnEdit, type SavedColumn } from './editColumnRules';
import { useCastReport } from './useCastReport';
import { relationBlockedReason, useColumnDraft } from './useColumnDraft';

type RunMigration = (options: {
  titlePlaceholder: string;
  changes: { type: string; name: string; oldName?: string; detail?: React.ReactNode }[];
  tableId: string;
  showSqlEditor: boolean;
  initialSql?: string;
  sqlRequired?: boolean;
  run: (migrationName: string) => Promise<unknown>;
  onSuccess: () => void;
}) => void;

type StoredColumn = Parameters<typeof buildEditColumns>[0][number];
type StoredRelations = Parameters<typeof buildEditRelations>[0];

export type EditColumnFormProps = {
  /** The column as the grid holds it. */
  column: StoredColumn;
  /** The open table's rows: a changed default does not reach the ones already there. */
  rows: unknown[];
  /** Closes without asking: the edit is saved. */
  onClose: () => void;
  /** Closes, asking about unsaved input first. */
  onCancel: () => void;
};

const LOCK_PRIMARY_KEY = 'A primary key’s type cannot be changed.';
const LOCK_FOREIGN_KEY = 'A column under a foreign key needs both sides changed together — use a SQL migration.';
const LOCK_SERIAL = 'An auto-incrementing column’s type cannot be changed.';

// A stored column of the open table. Its relation is saved as it changes (own migration); the rest is saved together,
// through the migration confirmation, as one `update_column`.
export function EditColumnForm({ column, rows, onClose, onCancel }: EditColumnFormProps) {
  const context = useTooljetDatabaseContext();
  const {
    organizationId,
    selectedTable,
    columns: storedColumns,
    configurations,
    foreignKeys,
  } = context as unknown as {
    organizationId: string;
    selectedTable: TjdbTable;
    columns: StoredColumn[];
    configurations: Record<string, unknown>;
    foreignKeys: StoredRelations;
  };
  const selectedEnvironment = useTjdbStore(
    (state: { selectedEnvironment: { id: string } | null }) => state.selectedEnvironment
  );
  const { fetchTableMetadata, setQueryFilters, resetView } = useTjdbActions();
  const { runMigration, modal } = useMigrationModal() as unknown as {
    runMigration: RunMigration;
    modal: React.ReactNode;
  };

  // As opened: what the drawer compares with, and what an unchanged field means.
  const opened = useMemo(() => {
    const [stored] = buildEditColumns([column], configurations);
    const isTimestamp = stored.data_type === 'timestamp with time zone';
    const saved: SavedColumn = {
      name: column.Header,
      dataType: column.dataType,
      columnDefault: column.column_default ?? null,
      constraints: {
        is_not_null: stored.constraints_type.is_not_null ?? false,
        is_unique: stored.constraints_type.is_unique ?? false,
        is_primary_key: stored.constraints_type.is_primary_key ?? false,
      },
      configurations: stored.configurations,
    };
    return {
      saved,
      // A timestamp column is shown in the browser's time zone until one is chosen.
      column: isTimestamp
        ? {
            ...stored,
            configurations: {
              ...stored.configurations,
              timezone: stored.configurations.timezone || getLocalTimeZone(),
            },
          }
        : stored,
      relations: buildEditRelations(
        (foreignKeys ?? []).filter((relation) => relation.column_names[0] === column.Header)
      ),
    };
    // Read once: the drawer edits the column as it was when opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { saved } = opened;

  const otherNames = useMemo(
    () => (storedColumns ?? []).map((item) => item.Header).filter((name) => name !== saved.name),
    [storedColumns, saved.name]
  );
  const draft = useColumnDraft(otherNames, { column: opened.column, relations: opened.relations });
  const { column: edited } = draft;
  // Once saved the draft is the column; the drawer stays mounted while it slides out.
  const [isSaved, setIsSaved] = useState(false);
  useReportUnsaved('editColumn', draft.isDirty && !isSaved);
  useEffect(() => {
    toast.dismiss();
  }, []);

  const isPrimaryKey = saved.constraints.is_primary_key;
  const isSerial = saved.dataType === 'serial';
  const hasRelation = draft.relations.length > 0;

  // The relation is saved under the name the server has; a rename in this form reaches it with the save.
  const live = useLiveRelations(selectedTable, draft, (relation) => relation.column_names[0] === saved.name);
  const savedAsStored = { ...edited, column_name: saved.name, data_type: saved.dataType };

  // A column that has a relation picks its default from the referenced values: under its name in this form.
  const defaultRelations = useMemo(
    () => draft.relations.map((relation) => ({ ...relation, column_names: [edited.column_name] })),
    [draft.relations, edited.column_name]
  );

  // The picker only offers values that exist in the referenced column: one that no longer does is cleared.
  useEffect(() => {
    const relation = opened.relations[0];
    if (!relation || !saved.columnDefault) return;
    const [target] = relation.referenced_column_names;
    const query = new PostgrestQueryBuilder();
    query.select(target);
    query.eq(target, saved.columnDefault);
    (
      tooljetDatabaseService.findOne(relation.referenced_table_id, query.url.toString()) as Promise<{
        data?: unknown[];
        error?: { message?: string };
      }>
    )
      .then(({ data = [], error }) => {
        if (error) toast.error(error.message ?? 'Failed to validate default value');
        if (error || data.length === 0) draft.setDefault(null);
      })
      .catch(() => draft.setDefault(null));
    // On open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Which types the column may become: its own, and what a supported cast reaches. Never for a primary key, an
  // auto-incrementing column or one under a foreign key.
  const typeLocked = isSerial || isPrimaryKey || hasRelation;
  const types = useMemo(() => {
    if (typeLocked) return dataTypes.filter((type) => type.value === saved.dataType);
    const reachable = new Set(allowedTargets(saved.dataType).map(({ to }: { to: string }) => to));
    return dataTypes.filter((type) => type.value === saved.dataType || reachable.has(type.value));
  }, [typeLocked, saved.dataType]);

  // Why a type is not offered: what is specific to this column first, then what holds for every column.
  const omittedReasons = useMemo(() => {
    if (typeLocked) return [];
    const offered = new Set(types.map((type) => type.value));
    const reasons = dataTypes
      .filter((type) => !offered.has(type.value))
      .map((type) => blockedReason(saved.dataType, type.value) as string | null)
      .filter((reason): reason is string => !!reason);
    const merged = [...new Set(reasons)];
    (ALWAYS_BLOCKED_REASONS as string[]).forEach((reason) => {
      if (!merged.includes(reason)) merged.push(reason);
    });
    return merged;
  }, [types, typeLocked, saved.dataType]);

  const castReport = useCastReport({
    savedType: saved.dataType,
    targetType: edited.data_type,
    columnName: saved.name,
    tableId: selectedTable.id,
    organizationId,
    environmentId: selectedEnvironment?.id,
  });

  const showBadRows = () => {
    if (castReport?.status !== 'done') return;
    const filter = inconsistentRowsFilter(castReport.probe);
    if (!filter) return;
    // A fresh view of exactly the rows the count counted, replacing whatever filters were active.
    setQueryFilters({ 0: { column: castReport.columnName, operator: filter.operator, value: filter.value } });
    onClose();
  };

  const refresh = async () => {
    const metadata = (await fetchTableMetadata(organizationId, selectedTable.table_name)) as {
      configurations: Record<string, unknown>;
      columns: StoredColumn[];
      foreignKeys: unknown[];
    } | null;
    if (!metadata) return;
    context.setConfigurations(metadata.configurations);
    if (metadata.columns.length > 0) context.setColumns(metadata.columns);
    context.setForeignKeys([...metadata.foreignKeys]);
  };

  const submit = () => {
    const plan = planColumnEdit(saved, edited);
    runMigration({
      titlePlaceholder: plan.title,
      changes: plan.changes.map(({ detail, ...change }) => ({
        ...change,
        ...(detail && { detail: typeof detail === 'string' ? detail : typeChangeDetail(detail.from, detail.to) }),
      })),
      tableId: selectedTable.id,
      showSqlEditor: true,
      // The SQL step is the only thing that performs a cast: an empty box must block, not skip it and report success.
      ...(plan.initialSql && { initialSql: plan.initialSql, sqlRequired: plan.sqlRequired }),
      run: (migrationName) =>
        tooljetDatabaseService.updateColumn(organizationId, selectedTable.table_name, plan.request(migrationName)),
      onSuccess: () => {
        // The saved filters and sort may name the old column name.
        if (plan.isRenamed) resetView(selectedTable.id);
        setIsSaved(true);
        refresh();
        context.handleRefetchQuery();
        toast.success('Column edited successfully');
        onClose();
      },
    });
  };

  const defaultWarning =
    edited.constraints_type.is_not_null &&
    !isSerial &&
    rows.length > 0 &&
    !!edited.column_default &&
    !!saved.columnDefault
      ? 'Changing the default value will NOT update the fields having existing default value'
      : null;

  return (
    <>
      <DrawerShell
        title="Edit column"
        data-cy="create-new-column-header"
        titleAdornment={
          isPrimaryKey ? (
            <Tag variant="outline" leadingVisual={<KeyRound />}>
              Primary key
            </Tag>
          ) : undefined
        }
        onClose={onCancel}
        footerStart={<FooterNote>Queries and apps using this table aren’t updated automatically.</FooterNote>}
        submitLabel="Save changes"
        submitDataCy="save-changes-button"
        submitDisabled={!draft.canSubmit || !draft.isDirty}
        onSubmit={submit}
      >
        <div className="tw-flex tw-flex-col tw-gap-4">
          <ColumnFields
            draft={draft}
            otherNames={otherNames}
            defaultRelations={defaultRelations}
            typeLockReason={
              typeLocked ? (isPrimaryKey ? LOCK_PRIMARY_KEY : hasRelation ? LOCK_FOREIGN_KEY : LOCK_SERIAL) : null
            }
            types={types}
            typeFooter={
              omittedReasons.length > 0 && (
                <div
                  className="tw-mt-1 tw-flex tw-items-start tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-2 tw-pb-1 tw-pt-2 tw-font-body-small tw-text-text-placeholder"
                  title={`Not supported out of the box:\n• ${omittedReasons.join('\n• ')}\nWrite a SQL migration from the migration history drawer for these.`}
                  data-cy="data-type-omitted-footer"
                >
                  <CircleAlert className="tw-mt-px tw-size-3.5 tw-shrink-0 tw-text-icon-strong" aria-hidden />
                  <span>Not seeing the type you need? Some conversions need a SQL migration.</span>
                </div>
              )
            }
            typeNotice={<CastNotice report={castReport} onShowRows={showBadRows} />}
            defaultLocked={isSerial || isPrimaryKey}
            defaultWarning={defaultWarning}
          />
          <Separator />
          <RelationList
            tableName={selectedTable.table_name}
            draft={draft}
            actions={live.actions}
            sourceColumns={[savedAsStored]}
            forColumn={{ name: saved.name, addDisabledReason: relationBlockedReason(savedAsStored, []) }}
          />
        </div>
      </DrawerShell>
      {live.modal}
      {modal}
    </>
  );
}
