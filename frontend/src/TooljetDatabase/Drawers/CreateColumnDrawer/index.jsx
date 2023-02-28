import React, { useState, useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateColumnForm from '../../Forms/ColumnForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { ButtonSolid } from '../../../_ui/AppButton/AppButton';

const CreateColumnDrawer = () => {
  const { organizationId, selectedTable, setColumns, setSelectedTableData } = useContext(TooljetDatabaseContext);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsCreateColumnDrawerOpen(!isCreateColumnDrawerOpen)}
        className="btn border-0 add-new-column-btn tj-text-xsm font-weight-500"
      >
        &nbsp;&nbsp;Add new column
      </button>

      <Drawer isOpen={isCreateColumnDrawerOpen} onClose={() => setIsCreateColumnDrawerOpen(false)} position="right">
        <CreateColumnForm
          onCreate={() => {
            tooljetDatabaseService.viewTable(organizationId, selectedTable).then(({ data = [], error }) => {
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
            tooljetDatabaseService.findOne(organizationId, selectedTable).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Failed to fetch table "${selectedTable}"`);
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
