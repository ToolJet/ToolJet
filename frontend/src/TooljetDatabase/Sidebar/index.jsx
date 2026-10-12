import React, { useState, useEffect, useContext } from 'react';
import List from '../TableList';
import CreateTableDrawer from '../Drawers/CreateTableDrawer';
import { OrganizationList } from '@/modules/dashboard/components';
import cx from 'classnames';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { authenticationService, tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';

export default function Sidebar({ collapseSidebar }) {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [tablesLimit, setTablesLimit] = useState({});
  const [rowsLimit, setRowsLimit] = useState({});
  const isAdmin = authenticationService.currentSessionValue?.admin === true;
  // totalRecords changes after any row add/delete/bulk-upload on the open table - used purely
  // as a signal to re-check the workspace-wide row limit, not as the limit's own count.
  const { totalRecords } = useContext(TooljetDatabaseContext);

  useEffect(() => {
    async function fetchRowsLimit() {
      try {
        const data = await tooljetDatabaseService.getRowsLimit();
        setRowsLimit(data?.data?.rowsCount);
      } catch (error) {
        console.error('Error fetching rows limit:', error);
      }
    }
    fetchRowsLimit();
  }, [totalRecords]);

  // A limit is "nearing or reached" using the same threshold the message generators use.
  const isNearingOrReached = (limit) =>
    !limit?.canAddUnlimited && (limit?.percentage >= 90 || (limit?.total <= 10 && limit?.current === limit?.total - 1));

  const tablesTriggered = isNearingOrReached(tablesLimit);
  const rowsTriggered = isNearingOrReached(rowsLimit);

  // Always show the combined banner (both counters) when either limit is nearing/reached.
  let bannerType = null;
  let bannerLimits = {};
  let bannerBreakdown = [];
  if (tablesTriggered || rowsTriggered) {
    const canAddUnlimited = (tablesLimit?.canAddUnlimited ?? true) && (rowsLimit?.canAddUnlimited ?? true);
    bannerType = 'database';
    bannerLimits = {
      percentage: Math.max(tablesLimit?.percentage || 0, rowsLimit?.percentage || 0),
      canAddUnlimited,
      licenseStatus: tablesLimit?.licenseStatus || rowsLimit?.licenseStatus,
    };
    bannerBreakdown = [
      {
        label: 'Tables',
        value: tablesLimit?.canAddUnlimited ? 'Unlimited' : `${tablesLimit?.current ?? 0}/${tablesLimit?.total ?? 0}`,
      },
      {
        label: 'Rows',
        value: rowsLimit?.canAddUnlimited ? 'Unlimited' : `${rowsLimit?.current ?? 0}/${rowsLimit?.total ?? 0}`,
      },
    ];
  }

  const isResourceLimitReached =
    (!tablesLimit?.canAddUnlimited && tablesLimit?.percentage === 100) ||
    (!rowsLimit?.canAddUnlimited && rowsLimit?.percentage === 100);

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
          className={`sidebar-list-wrap ${!bannerType ? '' : 'sidebar-list-wrap-with-banner'} ${
            isAdmin ? 'isAdmin' : ''
          } ${isResourceLimitReached ? 'resource-limit-reached' : ''}`}
        >
          <List />
        </div>
        {bannerType && (
          <LicenseBanner
            classes="mb-3 small"
            limits={bannerLimits}
            breakdown={bannerBreakdown}
            type={bannerType}
            size="small"
            style={{ marginTop: '20px' }}
            z-index="10000"
          />
        )}
        <OrganizationList />
      </div>
    </div>
  );
}
