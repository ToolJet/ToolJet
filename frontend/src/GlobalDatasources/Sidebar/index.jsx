import React from 'react';
import { CreateDataSourceModal } from '../CreateDataSourceModal';

export const Sidebar = ({ updateSelecteDatasource }) => {
  return (
    <div className="global-datasources-sidebar col border-bottom">
      <CreateDataSourceModal updateSelecteDatasource={updateSelecteDatasource} />
    </div>
  );
};
