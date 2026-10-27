import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../../Forms/TableForm';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { authenticationService } from '@/_services/authentication.service';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { getLimitState } from '@/modules/common/helpers/limitGating';
import { useLicenseStore } from '@/_stores/licenseStore';

export default function CreateTableDrawer({ tablesLimit, setTablesLimit }) {
  const { organizationId, setSelectedTable, setTables, tables, canEditTjdb } = useTooljetDatabaseContext();
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const fetchTablesLimit = async () => {
    try {
      const data = await tooljetDatabaseService.getTablesLimit();
      setTablesLimit(data?.data?.tablesCount);
      return data?.data?.tablesCount;
    } catch (error) {
      console.error('Error fetching tables limit:', error);
      return tablesLimit;
    }
  };

  useEffect(() => {
    fetchTablesLimit();
  }, [tables]);

  // Re-check the plan limit on click so the decision uses fresh counts. At the limit, the
  // limit-reached modal opens instead of the drawer.
  const openCreateTableDrawer = async () => {
    const limit = await fetchTablesLimit();
    if (getLimitState(limit).reached) {
      const rowsLimit = await tooljetDatabaseService
        .getRowsLimit()
        .then((data) => data?.data?.rowsCount)
        .catch(() => null);
      useLicenseStore.getState().actions.openLimitReached({
        resource: 'tables',
        limits: [
          { label: 'Tables', limit },
          { label: 'Rows', limit: rowsLimit },
        ],
      });
      return;
    }
    setIsCreateTableDrawerOpen(true);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <ButtonSolid
          type="button"
          variant="primary"
          disabled={!canEditTjdb}
          onClick={() => {
            posthogHelper.captureEvent('click_add_tooljet_table_button', {
              workspace_id:
                authenticationService?.currentUserValue?.organization_id ||
                authenticationService?.currentSessionValue?.current_organization_id,
              datasource: 'tooljet_db',
            });
            if (isCreateTableDrawerOpen) {
              setIsCreateTableDrawerOpen(false);
            } else {
              openCreateTableDrawer();
            }
          }}
          className="create-new-table-btn"
          data-cy="add-table-button"
        >
          Create new table
        </ButtonSolid>
      </div>
      <Drawer
        isOpen={isCreateTableDrawerOpen}
        onClose={() => setIsCreateTableDrawerOpen(false)}
        position="right"
        drawerStyle={{ width: '640px' }}
        className="tj-db-drawer"
      >
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
          initiator="CreateTableForm"
          tablesLimit={tablesLimit}
        />
      </Drawer>
    </div>
  );
}
