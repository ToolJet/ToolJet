import React from 'react';
import { CreateDataSourceModal } from '../CreateDataSourceModal';

export const Sidebar = () => {
  return (
    <div className="global-datasources-sidebar col border-bottom">
      <CreateDataSourceModal />
    </div>
  );
};
