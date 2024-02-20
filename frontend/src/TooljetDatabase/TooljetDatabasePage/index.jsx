import React, { useContext, useState } from 'react';
import cx from 'classnames';
import Table from '../Table';
import Sidebar from '../Sidebar';
import { TooljetDatabaseContext } from '../index';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import Warning from '../Icons/warning.svg';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { isEmpty } from 'lodash';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import { tooljetDatabaseService } from '@/_services';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../Forms/TableForm';
import { BreadCrumbContext } from '@/App/App';

const TooljetDatabasePage = ({ totalTables, collapseSidebar }) => {
  const { organizationId, setSelectedTable, setTables, selectedTable } = useContext(TooljetDatabaseContext);
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const emptyMessage = "You don't have any tables yet.";
  const EmptyState = () => {
    return (
      <>
        <div className="empty-table-container">
          <div>
            <div className="warning-icon-container">
              <Warning />
            </div>
            <div className="text-h3" style={{ width: '400px', textAlign: 'center' }} data-cy="do-not-have-records-text">
              {emptyMessage}
              <p className="empty-table-description mb-2">Create a table to get started!</p>
            </div>
            <div style={{ width: '180px', margin: '0px auto' }}>
              <ButtonSolid
                variant="tertiary"
                disabled={false}
                onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
                size="sm"
                className="px-1 pe-3 ps-2 gap-0"
              >
                <Plus fill="#697177" style={{ height: '16px' }} />
                Create new table
              </ButtonSolid>
            </div>
          </div>
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
  };

  return (
    <div className="row gx-0">
      <Sidebar collapseSidebar={collapseSidebar} />
      <div className={cx('col animation-fade database-page-content-wrap vh-100')}>
        {totalTables === 0 && <EmptyState />}
        {!isEmpty(selectedTable) && (
          <div className={cx('col')}>
            <Table collapseSidebar={collapseSidebar} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TooljetDatabasePage;
