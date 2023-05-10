import React from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/_components/OrganizationManager/List';

export default function Sidebar() {
  return (
    <div className="tooljet-database-sidebar col">
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
