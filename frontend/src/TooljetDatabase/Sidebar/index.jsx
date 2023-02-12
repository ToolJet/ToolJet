import React from 'react';
import Search from '../Search';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';

export default function Sidebar() {
  return (
    <div className="tooljet-database-sidebar col">
      <div className="sidebar-container">
        <CreateTableDrawer />
        <Search />
      </div>
      <div className="col table-left-sidebar">
        <div className="p-3">
          <List />
        </div>
      </div>
    </div>
  );
}
