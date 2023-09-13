import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import EditRowForm from '../../Forms/EditRowForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const EditRowDrawer = ({ isCreateRowDrawerOpen, setIsCreateRowDrawerOpen }) => {
  const { organizationId, selectedTable, setSelectedTableData, setTotalRecords } = useContext(TooljetDatabaseContext);

  return (
    <>
      <button
        onClick={() => setIsCreateRowDrawerOpen(!isCreateRowDrawerOpen)}
        className={`ghost-black-operation ${isCreateRowDrawerOpen ? 'open' : ''}`}
      >
        <SolidIcon name="editrectangle" width="14" fill={isCreateRowDrawerOpen ? '#3E63DD' : '#889096'} />
        &nbsp;&nbsp;
        <span data-cy="edit-row-button-text" className="tj-text-xsm font-weight-500">
          Edit row
        </span>
      </button>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <EditRowForm
          onEdit={() => {
            tooljetDatabaseService.findOne(organizationId, selectedTable.id).then(({ headers, data = [], error }) => {
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
            setIsCreateRowDrawerOpen(false);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default EditRowDrawer;
