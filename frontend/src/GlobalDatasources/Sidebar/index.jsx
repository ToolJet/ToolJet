import React, { useContext } from 'react';
import cx from 'classnames';
import { GlobalDataSourcesContext } from '..';
import { CreateDataSource } from '../CreateDataSource';

export const Sidebar = ({ updateSelectedDatasource, renderSidebarList }) => {
  const { canCreateDataSource } = useContext(GlobalDataSourcesContext);

  return (
    <div className={cx('global-datasources-sidebar col border-bottom', { 'two-rows-grid': !canCreateDataSource() })}>
      {canCreateDataSource() && renderSidebarList()}
      <CreateDataSource updateSelectedDatasource={updateSelectedDatasource} />
    </div>
  );
};
