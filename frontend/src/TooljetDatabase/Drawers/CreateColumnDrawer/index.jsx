import React from 'react';
import Drawer from '@/_ui/Drawer';
import CreateColumnForm from '../../Forms/ColumnForm';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';

const CreateColumnDrawer = ({
  setIsCreateColumnDrawerOpen,
  isCreateColumnDrawerOpen,
  rows,
  referencedColumnDetails,
  setReferencedColumnDetails,
  // The grid goes back to page 1 because the open table's shape changed. Pass false when the column is added to a
  // table that is not the open one (Tables panel), so the open grid keeps its page.
  resetPage = true,
}) => {
  const { organizationId, selectedTable, setColumns, handleRefetchQuery, setForeignKeys, setConfigurations } =
    useTooljetDatabaseContext();
  const { fetchTableMetadata, setPageCount } = useTjdbActions();

  return (
    <>
      <Drawer
        isOpen={isCreateColumnDrawerOpen}
        onClose={() => setIsCreateColumnDrawerOpen(false)}
        position="right"
        className="tj-db-drawer"
      >
        <CreateColumnForm
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
          onClose={() => setIsCreateColumnDrawerOpen(false)}
          rows={rows}
          referencedColumnDetails={referencedColumnDetails}
          setReferencedColumnDetails={setReferencedColumnDetails}
          initiator="CreateColumnForm"
        />
      </Drawer>
    </>
  );
};

export default CreateColumnDrawer;
