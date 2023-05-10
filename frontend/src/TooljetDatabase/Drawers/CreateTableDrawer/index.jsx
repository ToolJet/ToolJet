import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../../Forms/TableForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { BreadCrumbContext } from '@/App/App';

export default function CreateTableDrawer() {
  const { organizationId, setSelectedTable, setTables } = useContext(TooljetDatabaseContext);
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  return (
    <>
      <div>
        <ButtonSolid
          type="button"
          variant="primary"
          onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
          className="create-new-table-btn"
          data-cy="add-table-button"
        >
          Create new table
        </ButtonSolid>
      </div>
      <Drawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} position="right">
        <CreateTableForm
          onCreate={(tableName) => {
            tooljetDatabaseService.findAll(organizationId).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? 'Failed to fetch tables');
                return;
              }

              if (Array.isArray(data?.result) && data.result.length > 0) {
                setTables(data.result || []);
                setSelectedTable(tableName);
                updateSidebarNAV(tableName);
              }
            });
            setIsCreateTableDrawerOpen(false);
          }}
          onClose={() => setIsCreateTableDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
}
