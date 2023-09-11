import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../../Forms/TableForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService, authenticationService } from '@/_services';
import posthog from 'posthog-js';
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
          onClick={() => {
            posthog.capture('click_add_tooljet_table_button', {
              workspace_id:
                authenticationService?.currentUserValue?.organization_id ||
                authenticationService?.currentSessionValue?.current_organization_id,
              datasource: 'tooljet_db',
            });
            setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen);
          }}
          className="create-new-table-btn"
          data-cy="add-table-button"
        >
          Create new table
        </ButtonSolid>
      </div>
      <Drawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} position="right">
        <CreateTableForm
          onCreate={(tableInfo) => {
            tooljetDatabaseService.findAll(organizationId).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? 'Failed to fetch tables');
                return;
              }

              if (Array.isArray(data?.result) && data.result.length > 0) {
                setSelectedTable({ table_name: tableInfo.table_name, id: tableInfo.id });
                updateSidebarNAV(tableInfo.table_name);
                setTables(data.result || []);
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
