import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import { appsService } from '@/_services/apps.service';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import generateFile from '@/_lib/generate-file';
import EditTableForm from '../Forms/TableForm';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import DeleteTableModal from '../DeleteTableModal';
import ExportCsvModal from '../ExportCsvModal';
import { buildEditTableFormData, type TableColumn } from '../TableActions/editTableFormData';
import { TableSchemaScope } from '../TableActions/TableSchemaScope';
import { useTjdbActions, useTjdbStore } from '../_stores/tjdbStore';
import { useTooljetDatabaseContext, type TjdbTable } from '../TooljetDatabaseContext';
import type { TableRowAction } from './TableRow';

interface Dependents {
  count: number;
  foreignKeyTables?: Array<{ name: string }>;
}

interface DeleteState {
  table: TjdbTable | null;
  isOpen: boolean;
  loading: boolean;
  submitting: boolean;
  dependents: Dependents | null;
  error: string | null;
}

const DELETE_CLOSED: DeleteState = {
  table: null,
  isOpen: false,
  loading: false,
  submitting: false,
  dependents: null,
  error: null,
};

// Check what depends on the table, then delete it. The migration name records the drop in the table's history.
function useDeleteTable(organizationId: string | null, onDeleted: () => void) {
  const { bumpMigrations } = useTjdbActions();
  const [state, setState] = useState<DeleteState>(DELETE_CLOSED);

  const open = (table: TjdbTable) => {
    setState({ ...DELETE_CLOSED, table, isOpen: true, loading: true });
    tooljetDatabaseService
      .getTableDependents(organizationId, table.id)
      .then(({ data, error }: { data?: { result?: Dependents }; error?: unknown }) => {
        setState((previous) => {
          // Cancelled before this resolved: nothing to update.
          if (!previous.isOpen || previous.table?.id !== table.id) return previous;
          return {
            ...previous,
            loading: false,
            dependents: error ? null : (data?.result ?? null),
            error: error ? 'Failed to check if table is in use. Proceed with caution.' : null,
          };
        });
      });
  };

  const close = () => setState((previous) => ({ ...previous, isOpen: false }));

  const confirm = () => {
    const table = state.table;
    if (!table) return;
    setState((previous) => ({ ...previous, submitting: true, error: null }));
    tooljetDatabaseService
      .deleteTable(organizationId, table.table_name, `Drop table "${table.table_name}"`)
      .then(({ error }: { error?: { message?: string } }) => {
        if (error) {
          setState((previous) => ({
            ...previous,
            submitting: false,
            error: error?.message ?? 'Failed to delete table',
          }));
          return;
        }
        toast.success(`Table "${table.table_name}" deleted successfully`);
        bumpMigrations();
        close();
        onDeleted();
      });
  };

  const blocked =
    !state.loading &&
    !!state.dependents &&
    (state.dependents.count > 0 || (state.dependents.foreignKeyTables?.length ?? 0) > 0);

  return { state, blocked, open, close, confirm };
}

const DrawerLoading = () => (
  <div className="tw-flex tw-flex-col tw-gap-3 tw-p-6">
    <Skeleton className="tw-h-6 tw-w-1/3" />
    <Skeleton className="tw-h-10 tw-w-full" />
    <Skeleton className="tw-h-10 tw-w-full" />
  </div>
);

interface EditTableBodyProps {
  table: TjdbTable;
  isOpenTable: boolean;
  onRenamed: (table: TjdbTable) => void;
  onClose: () => void;
}

// Runs inside TableSchemaScope, so `context` describes `table` whichever table the grid has open.
function EditTableBody({ table, isOpenTable, onRenamed, onClose }: EditTableBodyProps) {
  const context = useTooljetDatabaseContext();
  const { fetchTableMetadata, setPageCount } = useTjdbActions();
  const { selectedColumns, selectedTableData } = useMemo(
    () => buildEditTableFormData(context.columns as TableColumn[]),
    [context.columns]
  );

  const handleEdited = (tableName: string) => {
    fetchTableMetadata(context.organizationId, tableName).then(
      (
        metadata: { configurations: Record<string, unknown>; columns: TableColumn[]; foreignKeys: unknown[] } | null
      ) => {
        if (!metadata) return;
        context.setConfigurations(metadata.configurations);
        if (metadata.columns.length > 0) context.setColumns(metadata.columns);
        context.setForeignKeys([...metadata.foreignKeys]);
      }
    );
    // The scope refetches the grid only when `table` is the open table; the page number is the page's own state.
    context.handleRefetchQuery();
    if (isOpenTable) setPageCount(1);
    onClose();
  };

  return (
    <EditTableForm
      selectedColumns={selectedColumns}
      selectedTable={table}
      selectedTableData={selectedTableData}
      updateSelectedTable={onRenamed}
      onEdit={handleEdited}
      onClose={onClose}
      initiator="EditTableForm"
    />
  );
}

function AddColumnBody({
  open,
  isOpenTable,
  onClose,
  referenced,
  setReferenced,
}: {
  open: boolean;
  isOpenTable: boolean;
  onClose: () => void;
  referenced: unknown[];
  setReferenced: (value: unknown[]) => void;
}) {
  const { selectedTableData } = useTooljetDatabaseContext();
  return (
    <CreateColumnDrawer
      isCreateColumnDrawerOpen={open}
      setIsCreateColumnDrawerOpen={(isOpen: boolean) => !isOpen && onClose()}
      rows={selectedTableData}
      referencedColumnDetails={referenced}
      setReferencedColumnDetails={setReferenced}
      resetPage={isOpenTable}
    />
  );
}

type DrawerKind = 'edit' | 'addColumn' | 'exportCsv';
interface Active {
  kind: DrawerKind;
  table: TjdbTable;
  /** Changes on every run, so a reopened action loads its table again. */
  runId: number;
}

// Row actions for the Tables panel. Every action takes the row's table, so none depends on which table is open.
// `run` starts one; render `host` once for the drawers and modals they open.
export function useTableActions({ refetchTables }: { refetchTables: () => void }) {
  const { organizationId, tables, selectedTable, setSelectedTable, setTables } = useTooljetDatabaseContext();
  const environments = useTjdbStore((state: { environments: unknown[] }) => state.environments);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [active, setActive] = useState<Active | null>(null);
  const [open, setOpen] = useState(false);
  const [referenced, setReferenced] = useState<unknown[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const deletion = useDeleteTable(organizationId, refetchTables);

  const exportSchema = (table: TjdbTable) =>
    appsService
      .exportResource({ tooljet_database: [{ table_id: table.id }], organization_id: organizationId })
      .then((data: unknown) => {
        const name = table.table_name.replace(/\s+/g, '-').toLowerCase();
        generateFile(`${name}-export-${new Date().getTime()}.json`, JSON.stringify(data, null, 2), 'json');
      })
      .catch(() => toast.error('Could not export table.', { position: 'top-center' }));

  const run = (action: TableRowAction, table: TjdbTable) => {
    if (action === 'exportSchema') {
      exportSchema(table);
    } else if (action === 'delete') {
      deletion.open(table);
    } else {
      setActive((previous) => ({ kind: action, table, runId: (previous?.runId ?? 0) + 1 }));
      setOpen(true);
    }
  };

  // A renamed table updates the list. It becomes the open table only if it already was.
  const handleRenamed = (renamed: TjdbTable) => {
    if (selectedTable.id === renamed.id) setSelectedTable(renamed);
    setTables((previous) =>
      (previous as TjdbTable[]).map((table) =>
        table.id === renamed.id ? { ...table, table_name: renamed.table_name } : table
      )
    );
  };

  const deleting = deletion.state;
  const host = (
    <>
      {active?.kind === 'edit' && (
        <Drawer
          disableFocus
          isOpen={open}
          onClose={close}
          position="right"
          drawerStyle={{ width: '640px' }}
          className="tj-db-drawer"
        >
          <TableSchemaScope table={active.table} fallback={<DrawerLoading />} onError={close}>
            <EditTableBody
              table={active.table}
              isOpenTable={selectedTable.id === active.table.id}
              onRenamed={handleRenamed}
              onClose={close}
            />
          </TableSchemaScope>
        </Drawer>
      )}
      {active?.kind === 'addColumn' && (
        <TableSchemaScope key={active.runId} table={active.table} onError={close}>
          <AddColumnBody
            open={open}
            isOpenTable={selectedTable.id === active.table.id}
            onClose={close}
            referenced={referenced}
            setReferenced={setReferenced}
          />
        </TableSchemaScope>
      )}
      {active?.kind === 'exportCsv' && (
        <ExportCsvModal
          show={open}
          darkMode={darkMode}
          tableName={active.table.table_name}
          tableId={active.table.id}
          organizationId={organizationId}
          environments={environments}
          relationsByEnvironment={
            (tables as Array<TjdbTable & { environments?: unknown[] }>).find((table) => table.id === active.table.id)
              ?.environments ?? []
          }
          onCancel={close}
        />
      )}
      {deleting.table && (
        <DeleteTableModal
          show={deleting.isOpen}
          darkMode={darkMode}
          tableName={deleting.table.table_name}
          loading={deleting.loading}
          blocked={deletion.blocked}
          dependents={deleting.dependents}
          error={deleting.error}
          submitting={deleting.submitting}
          onConfirm={deletion.confirm}
          onCancel={deletion.close}
        />
      )}
    </>
  );

  return { run, host };
}
