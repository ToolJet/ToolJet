import React from 'react';
import Search from '../Search';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';

export default function Sidebar() {
  return (
    <div className="tooljet-database-sidebar col border-bottom">
      <div className="sidebar-container border-bottom border-end">
        <CreateTableDrawer />
        <Search />
      </div>
      <div className="col table-left-sidebar border-end" data-cy="all-table-column">
        <div className="p-3">
          <List />
        </div>
      </div>
    </div>
  );
}
