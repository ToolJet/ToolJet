import React, { useState } from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/modules/dashboard/components';
import cx from 'classnames';

export default function Sidebar({ collapseSidebar }) {
  const [bannerVisible, setBannerVisible] = useState(false);
  return (
    <div className={cx('tooljet-database-sidebar col d-flex flex-column', { 'visually-hidden': collapseSidebar })}>
      <div className={`sidebar-container ${!bannerVisible ? '' : 'sidebar-container-with-banner'}`}>
        <CreateTableDrawer bannerVisible={bannerVisible} setBannerVisible={setBannerVisible} />
      </div>
      <div className="col table-left-sidebar" data-cy="all-table-column">
        <div className={`sidebar-list-wrap ${!bannerVisible ? '' : 'sidebar-list-wrap-with-banner'}`}>
          <List />
        </div>
        <OrganizationList />
      </div>
    </div>
  );
}
