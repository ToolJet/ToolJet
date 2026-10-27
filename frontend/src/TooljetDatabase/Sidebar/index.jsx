import React, { useState, useEffect } from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/modules/dashboard/components';
import cx from 'classnames';
import { authenticationService } from '@/_services/authentication.service';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';

export default function Sidebar({ collapseSidebar }) {
  const [tablesLimit, setTablesLimit] = useState({});
  const [rowsLimit, setRowsLimit] = useState({});
  const isAdmin = authenticationService.currentSessionValue?.admin === true;
  // totalRecords changes after any row add/delete/bulk-upload on the open table - used purely
  // as a signal to re-check the workspace-wide row limit, not as the limit's own count.
  const { totalRecords } = useTooljetDatabaseContext();

  useEffect(() => {
    async function fetchRowsLimit() {
      try {
        const data = await tooljetDatabaseService.getRowsLimit();
        setRowsLimit(data?.data?.rowsCount);
      } catch (error) {
        console.error('Error fetching rows limit:', error);
      }
    }
    fetchRowsLimit();
  }, [totalRecords]);

  const isResourceLimitReached =
    (!tablesLimit?.canAddUnlimited && tablesLimit?.percentage === 100) ||
    (!rowsLimit?.canAddUnlimited && rowsLimit?.percentage === 100);

  return (
    <div className={cx('tooljet-database-sidebar col d-flex flex-column', { 'visually-hidden': collapseSidebar })}>
      <div className="sidebar-container">
        <CreateTableDrawer tablesLimit={tablesLimit} setTablesLimit={setTablesLimit} />
      </div>
      <div className="col table-left-sidebar" data-cy="all-table-column">
        <div
          className={`sidebar-list-wrap ${
            isAdmin ? 'isAdmin' : ''
          } ${isResourceLimitReached ? 'resource-limit-reached' : ''}`}
        >
          <List />
        </div>
        <OrganizationList />
      </div>
    </div>
  );
}
