import React, { useState } from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/modules/dashboard/components';
import cx from 'classnames';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { authenticationService } from '@/_services';

export default function Sidebar({ collapseSidebar }) {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [tablesLimit, setTablesLimit] = useState({});
  const isAdmin = authenticationService.currentSessionValue?.admin === true;
  const isResourceLimitReached = tablesLimit?.percentage === 100;
  return (
    <div className={cx('tooljet-database-sidebar col d-flex flex-column', { 'visually-hidden': collapseSidebar })}>
      <div className={`sidebar-container ${!bannerVisible ? '' : 'sidebar-container-with-banner'}`}>
        <CreateTableDrawer
          bannerVisible={bannerVisible}
          setBannerVisible={setBannerVisible}
          tablesLimit={tablesLimit}
          setTablesLimit={setTablesLimit}
        />
      </div>
      <div className="col table-left-sidebar" data-cy="all-table-column">
        <div
          className={`sidebar-list-wrap ${!bannerVisible ? '' : 'sidebar-list-wrap-with-banner'} ${
            isAdmin ? 'isAdmin' : ''
          } ${isResourceLimitReached ? 'resource-limit-reached' : ''}`}
        >
          <List />
        </div>
        <LicenseBanner
          classes="mb-3 small"
          limits={tablesLimit}
          type="tables"
          size="small"
          style={{ marginTop: '20px' }}
          z-index="10000"
        />
        <OrganizationList />
      </div>
    </div>
  );
}
