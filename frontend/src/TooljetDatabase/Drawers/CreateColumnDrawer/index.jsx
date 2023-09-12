import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateColumnForm from '../../Forms/ColumnForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const CreateColumnDrawer = ({ setIsCreateColumnDrawerOpen, isCreateColumnDrawerOpen }) => {
  const { organizationId, selectedTable, setColumns, setSelectedTableData } = useContext(TooljetDatabaseContext);

  return (
    <>
      <button
        onClick={() => setIsCreateColumnDrawerOpen(!isCreateColumnDrawerOpen)}
        className={`ghost-black-operation ${isCreateColumnDrawerOpen ? 'open' : ''}`}
        data-cy="add-new-column-button"
      >
        <SolidIcon name="column" width="14" fill={isCreateColumnDrawerOpen ? '#3E63DD' : '#889096'} />
        <span className=" tj-text-xsm font-weight-500" style={{ marginLeft: '6px' }}>
          Add new column
        </span>
      </button>

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
                  data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
                    Header: column_name,
                    accessor: column_name,
                    dataType: data_type,
                    isPrimaryKey: keytype?.toLowerCase() === 'primary key',
                    ...rest,
                  }))
                );
              }
            });
            tooljetDatabaseService.findOne(organizationId, selectedTable.id).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Failed to fetch table "${selectedTable.table_name}"`);
                return;
              }

              if (Array.isArray(data) && data?.length > 0) {
                setSelectedTableData(data);
              }
            });
            setIsCreateColumnDrawerOpen(false);
          }}
          onClose={() => setIsCreateColumnDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default CreateColumnDrawer;
