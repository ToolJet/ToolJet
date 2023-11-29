import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateRowForm from '../../Forms/RowForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const CreateRowDrawer = ({ isCreateRowDrawerOpen, setIsCreateRowDrawerOpen }) => {
  const { organizationId, selectedTable, setSelectedTableData, setTotalRecords } = useContext(TooljetDatabaseContext);

  return (
    <>
      <button
        onClick={() => {
          setIsCreateRowDrawerOpen(!isCreateRowDrawerOpen);
        }}
        className={`ghost-black-operation ${isCreateRowDrawerOpen ? 'open' : ''}`}
      >
        <SolidIcon name="row" width="14" fill={isCreateRowDrawerOpen ? '#3E63DD' : '#889096'} />
        <span data-cy="add-new-row-button-text" className="tj-text-xsm font-weight-500" style={{ marginLeft: '6px' }}>
          Add new row
        </span>
      </button>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <CreateRowForm
          onCreate={() => {
            tooljetDatabaseService
              .findOne(organizationId, selectedTable.id, 'order=id.desc')
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
            setIsCreateRowDrawerOpen(false);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default CreateRowDrawer;
