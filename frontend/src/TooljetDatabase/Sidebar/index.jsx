import React from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/_components/OrganizationManager/List';
import cx from 'classnames';

export default function Sidebar({ collapseSidebar }) {
  return (
    <div className={cx('tooljet-database-sidebar col', { 'visually-hidden': collapseSidebar })}>
      <div className="sidebar-container">
        <CreateTableDrawer />
      </div>
      <div className="col table-left-sidebar" data-cy="all-table-column">
        <div className="sidebar-list-wrap">
          <List />
        </div>
        <OrganizationList />
      </div>
    </div>
  );
}
