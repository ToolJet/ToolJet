import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateRowForm from '../../Forms/RowForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';

const CreateRowDrawer = ({ isCreateRowDrawerOpen, setIsCreateRowDrawerOpen }) => {
  const {
    organizationId,
    selectedTable,
    setSelectedTableData,
    setTotalRecords,
    pageSize,
    setSortFilters,
    setQueryFilters,
  } = useContext(TooljetDatabaseContext);

  return (
    <>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <CreateRowForm
          onCreate={() => {
            const limit = pageSize;
            setSortFilters({});
            setQueryFilters({});
            tooljetDatabaseService
              .findOne(organizationId, selectedTable.id, `order=id.desc&limit=${limit}`)
              .then(({ headers, data = [], error }) => {
                if (error) {
                  toast.error(error?.message ?? `Failed to fetch table "${selectedTable.table_name}"`);
                  return;
                }

                if (Array.isArray(data) && data?.length > 0) {
                  const totalContentRangeRecords = headers['content-range'].split('/')[1] || 0;
                  setTotalRecords(totalContentRangeRecords);
                  setSelectedTableData(data);
                }
              });

            const tableElement = document.querySelector('.tj-db-table');
            if (tableElement) tableElement.scrollTop = 0;
            setIsCreateRowDrawerOpen(false);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default CreateRowDrawer;
