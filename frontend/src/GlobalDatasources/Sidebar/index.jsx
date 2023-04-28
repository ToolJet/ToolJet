import React from 'react';
import { CreateDataSourceModal } from '../CreateDataSourceModal';

export const Sidebar = ({ updateSelectedDatasource }) => {
  return (
    <div className="global-datasources-sidebar col border-bottom">
      <CreateDataSourceModal updateSelectedDatasource={updateSelectedDatasource} />
    </div>
  );
};
