import React, { useContext, useState } from 'react';
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
  const [shouldResetRowForm, setShouldResetRowForm] = useState(0);

  return (
    <>
      <Drawer
        isOpen={isCreateRowDrawerOpen}
        onClose={() => setIsCreateRowDrawerOpen(false)}
        position="right"
        className="tj-db-drawer"
      >
        <CreateRowForm
          onCreate={(shouldKeepDrawerOpen) => {
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
            if (!shouldKeepDrawerOpen) setIsCreateRowDrawerOpen(false);
            setShouldResetRowForm((prev) => prev + 1);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
          referencedColumnDetails={referencedColumnDetails}
          setReferencedColumnDetails={setReferencedColumnDetails}
          initiator="CreateRowForm"
          shouldResetRowForm={shouldResetRowForm}
        />
      </Drawer>
    </>
  );
};

export default CreateRowDrawer;
