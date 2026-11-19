import React from 'react';
import Drawer from '@/_ui/Drawer';
import { AddColumnForm } from '../ColumnDrawer/AddColumnForm';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { useGuardedClose } from '../../_stores/unsavedChanges';

const CreateColumnDrawer = ({
  setIsCreateColumnDrawerOpen,
  isCreateColumnDrawerOpen,
  // The grid goes back to page 1 because the open table's shape changed. Pass false when the column is added to a
  // table that is not the open one (Tables panel), so the open grid keeps its page.
  resetPage = true,
}) => {
  const { organizationId, selectedTable, setColumns, handleRefetchQuery, setForeignKeys, setConfigurations } =
    useTooljetDatabaseContext();
  const { fetchTableMetadata, setPageCount } = useTjdbActions();
  // Backdrop, Cancel and Escape ask about unsaved input; creating the column closes through `onCreate`, unasked.
  const requestClose = useGuardedClose('createColumn', () => setIsCreateColumnDrawerOpen(false));

  return (
    <>
      <Drawer
        // The migration confirmation opens above this drawer; a focus trap here would keep it from taking focus.
        disableFocus
        isOpen={isCreateColumnDrawerOpen}
        onClose={requestClose}
        position="right"
        drawerStyle={{ width: '560px' }}
        className="tj-db-drawer"
      >
        <AddColumnForm
          onCreate={() => {
            fetchTableMetadata(organizationId, selectedTable.table_name).then((metadata) => {
              if (!metadata) return;
              setConfigurations(metadata.configurations);
              if (metadata.columns.length > 0) setColumns(metadata.columns);
              setForeignKeys([...metadata.foreignKeys]);
            });
            handleRefetchQuery();
            if (resetPage) setPageCount(1);
            setIsCreateColumnDrawerOpen(false);
          }}
          onCancel={requestClose}
        />
      </Drawer>
    </>
  );
};

export default CreateColumnDrawer;
