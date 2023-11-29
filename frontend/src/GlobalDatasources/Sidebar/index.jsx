import React from 'react';
import { CreateDataSource } from '../CreateDataSource';

export const Sidebar = ({ updateSelectedDatasource, renderSidebarList }) => {
  return (
    <div className="global-datasources-sidebar col border-bottom">
      {renderSidebarList()}
      <CreateDataSource updateSelectedDatasource={updateSelectedDatasource} />
    </div>
  );
};
