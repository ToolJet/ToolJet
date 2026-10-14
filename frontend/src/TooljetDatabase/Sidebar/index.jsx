import React, { useState } from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/modules/dashboard/components';
import cx from 'classnames';
import { authenticationService } from '@/_services';

export default function Sidebar({ collapseSidebar }) {
  const [tablesLimit, setTablesLimit] = useState({});
  const isAdmin = authenticationService.currentSessionValue?.admin === true;
  return (
    <div className={cx('tooljet-database-sidebar col d-flex flex-column', { 'visually-hidden': collapseSidebar })}>
      <div className="sidebar-container">
        <CreateTableDrawer tablesLimit={tablesLimit} setTablesLimit={setTablesLimit} />
      </div>
      <div className="col table-left-sidebar" data-cy="all-table-column">
        <div className={`sidebar-list-wrap ${isAdmin ? 'isAdmin' : ''}`}>
          <List />
        </div>
        <OrganizationList />
      </div>
    </div>
  );
}
