import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import CreateColumnForm from '../../Forms/ColumnForm';
import { TooljetDatabaseContext } from '../../index';
import { useTjdbStore, useTjdbActions } from '../../_stores/tjdbStore';

const CreateColumnDrawer = ({
  setIsCreateColumnDrawerOpen,
  isCreateColumnDrawerOpen,
  rows,
  referencedColumnDetails,
  setReferencedColumnDetails,
}) => {
  const { organizationId, selectedTable, setColumns, handleRefetchQuery, setForeignKeys, setConfigurations } =
    useContext(TooljetDatabaseContext);
  const pageSize = useTjdbStore((state) => state.pageSize);
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
            handleRefetchQuery({}, {}, 1, pageSize);
            setPageCount(1);
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
