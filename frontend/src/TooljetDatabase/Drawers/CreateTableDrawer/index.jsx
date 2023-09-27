import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../../Forms/TableForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService, authenticationService } from '@/_services';
import posthog from 'posthog-js';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { BreadCrumbContext } from '@/App/App';
import { LicenseBanner } from '@/LicenseBanner';

export default function CreateTableDrawer({ bannerVisible, setBannerVisible }) {
  const { organizationId, setSelectedTable, setTables, tables } = useContext(TooljetDatabaseContext);
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const [tablesLimit, setTablesLimit] = useState({});
  setBannerVisible(tablesLimit?.current >= tablesLimit?.total - 1 || false);

  useEffect(() => {
    async function fetchTablesLimit() {
      try {
        const data = await tooljetDatabaseService.getTablesLimit();
        setTablesLimit(data?.data?.tablesCount);
        setBannerVisible(tablesLimit?.current >= tablesLimit?.total - 1 || false);
      } catch (error) {
        console.error('Error fetching tables limit:', error);
      }
    }
    fetchTablesLimit();
  }, [tables, setBannerVisible]); // Empty dependency array to execute the effect only once when the component mounts

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <ButtonSolid
          type="button"
          variant="primary"
          disabled={tablesLimit?.current >= tablesLimit?.total}
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
      <LicenseBanner
        classes="mb-3 small"
        limits={tablesLimit}
        type="tables"
        size="small"
        style={{ marginTop: '20px' }}
        z-index="10000"
      />

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
    </div>
  );
}
