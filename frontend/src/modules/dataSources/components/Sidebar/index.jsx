import React from 'react';
import cx from 'classnames';
import { CreateDataSource } from '../CreateDataSource';

export const Sidebar = ({ updateSelectedDatasource, renderSidebarList }) => {
  return (
    <div className={cx('global-datasources-sidebar col border-bottom')}>
      {renderSidebarList()}
      <CreateDataSource updateSelectedDatasource={updateSelectedDatasource} />
    </div>
  );
};
