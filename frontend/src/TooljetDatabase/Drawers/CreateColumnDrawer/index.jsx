import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateColumnForm from '../../Forms/ColumnForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';

const CreateColumnDrawer = ({ setIsCreateColumnDrawerOpen, isCreateColumnDrawerOpen, rows }) => {
  const { organizationId, selectedTable, setColumns, setPageCount, handleRefetchQuery, pageSize } =
    useContext(TooljetDatabaseContext);

  return (
    <>
      <Drawer isOpen={isCreateColumnDrawerOpen} onClose={() => setIsCreateColumnDrawerOpen(false)} position="right">
        <CreateColumnForm
          onCreate={() => {
            tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
                return;
              }

              if (data?.result?.length > 0) {
                setColumns(
                  data?.result.map(({ column_name, data_type, ...rest }) => ({
                    Header: column_name,
                    accessor: column_name,
                    dataType: data_type,
                    ...rest,
                  }))
                );
              }
            });
            handleRefetchQuery({}, {}, 1, pageSize);
            setPageCount(1);
            setIsCreateColumnDrawerOpen(false);
          }}
          onClose={() => setIsCreateColumnDrawerOpen(false)}
          rows={rows}
        />
      </Drawer>
    </>
  );
};

export default CreateColumnDrawer;
