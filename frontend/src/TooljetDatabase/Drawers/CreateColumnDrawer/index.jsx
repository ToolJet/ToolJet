import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateColumnForm from '../../Forms/ColumnForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { getColumnDataType } from '../../constants';

const CreateColumnDrawer = ({
  setIsCreateColumnDrawerOpen,
  isCreateColumnDrawerOpen,
  rows,
  referencedColumnDetails,
  setReferencedColumnDetails,
}) => {
  const {
    organizationId,
    selectedTable,
    setColumns,
    setPageCount,
    handleRefetchQuery,
    pageSize,
    setForeignKeys,
    setConfigurations,
  } = useContext(TooljetDatabaseContext);

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
            tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
                return;
              }

              const { foreign_keys = [] } = data?.result || {};
              setConfigurations(data?.result?.configurations || {});
              if (data?.result?.columns?.length > 0) {
                setColumns(
                  data?.result?.columns.map(({ column_name, data_type, ...rest }) => ({
                    Header: column_name,
                    accessor: column_name,
                    dataType: getColumnDataType({ column_default: rest.column_default, data_type }),
                    ...rest,
                  }))
                );
              }

              if (foreign_keys.length > 0) {
                setForeignKeys([...foreign_keys]);
              } else {
                setForeignKeys([]);
              }
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
