import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import EditColumnForm from '../../Forms/EditColumnForm';
import { CHANGE_TYPE } from '../../MigrationConfirmModal';
import useMigrationModal from '../../MigrationConfirmModal/useMigrationModal';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { useGuardedClose } from '../../_stores/unsavedChanges';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import type { GridColumn, GridRow } from './useTableGrid';

// The two things a header's column menu does. Edit opens the column form in a drawer. Delete goes through the
// migration confirmation (which records it in the table's history), then reloads the columns and the rows.
// `overlays` must be rendered once, by the grid.
export function useColumnActions(rows: GridRow[]) {
  const { organizationId, selectedTable, setColumns, setForeignKeys, setConfigurations, handleRefetchQuery } =
    useTooljetDatabaseContext();
  const { fetchTableMetadata } = useTjdbActions();
  const { runMigration, modal } = useMigrationModal();
  const [isEditOpen, setIsEditOpen] = useState(false);
  // Kept while the drawer slides out.
  const editedColumn = useRef<GridColumn | null>(null);
  const [referencedColumnDetails, setReferencedColumnDetails] = useState([]);
  const closeEdit = () => setIsEditOpen(false);
  // Backdrop, Cancel and Escape ask about unsaved input; the form's own `onClose` (after a save) does not.
  const requestCloseEdit = useGuardedClose('editColumn', closeEdit);

  const editColumn = (column: GridColumn) => {
    editedColumn.current = column;
    setIsEditOpen(true);
  };

  const deleteColumn = (column: GridColumn) => {
    const columnName = column.Header;
    runMigration({
      titlePlaceholder: `Drop column "${columnName}"`,
      changes: [{ type: CHANGE_TYPE.REMOVE, name: columnName }],
      tableId: selectedTable.id,
      showSqlEditor: false,
      run: (migrationName: string) =>
        tooljetDatabaseService.deleteColumn(organizationId, selectedTable.table_name, columnName, migrationName),
      onSuccess: async () => {
        const metadata = await fetchTableMetadata(organizationId, selectedTable.table_name);
        if (metadata) {
          setConfigurations(metadata.configurations);
          if (metadata.columns.length > 0) setColumns(metadata.columns);
          setForeignKeys([...metadata.foreignKeys]);
        }
        handleRefetchQuery();
        toast.success(`Deleted ${columnName} from table "${selectedTable.table_name}"`);
      },
    });
  };

  const overlays = (
    <>
      <Drawer
        isOpen={isEditOpen}
        onClose={requestCloseEdit}
        position="right"
        drawerStyle={undefined}
        className="tj-db-drawer"
      >
        {editedColumn.current && (
          <EditColumnForm
            key={editedColumn.current.accessor}
            selectedColumn={editedColumn.current}
            setColumns={setColumns}
            onClose={closeEdit}
            onCancel={requestCloseEdit}
            rows={rows}
            isEditColumn={true}
            referencedColumnDetails={referencedColumnDetails}
            setReferencedColumnDetails={setReferencedColumnDetails}
            initiator="EditColumnForm"
          />
        )}
      </Drawer>
      {modal}
    </>
  );

  return { editColumn, deleteColumn, overlays };
}
