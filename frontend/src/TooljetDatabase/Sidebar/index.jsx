import React, { useState } from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/_components/OrganizationManager/List';

export default function Sidebar() {
  const [bannerVisible, setBannerVisible] = useState(false);
  console.log(bannerVisible);
  return (
    <div className="tooljet-database-sidebar col d-flex flex-column">
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
