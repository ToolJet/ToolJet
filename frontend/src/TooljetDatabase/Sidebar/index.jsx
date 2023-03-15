import React from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';

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
      </div>
    </div>
  );
}
