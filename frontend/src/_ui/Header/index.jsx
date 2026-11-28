import React from 'react';
import cx from 'classnames';
import { Breadcrumbs } from '../Breadcrumbs';
import { useLocation } from 'react-router-dom';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

import NewLayoutHeader from './NewLayoutHeader';
import BranchingActionButtons from './BranchingActionButtons';

import { routes, routesWithTags } from './helper';

function Header({ featureAccess, collapseSidebar = false, showNewHeader = false }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const location = useLocation();
  const pathname = routes(location?.pathname.split('/').pop(), location?.pathname);

  if (showNewHeader) {
    return <NewLayoutHeader featureAccess={featureAccess} />;
  }

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        {!collapseSidebar && (
          <div className="tj-dashboard-section-header" data-name={pathname}>
            <div className="row tw-w-full">
              <div className="col-9 d-flex">
                <p className="tj-text-md font-weight-500 text-black-000" data-cy="dashboard-section-header">
                  {pathname}
                </p>
                {routesWithTags(pathname) && (
                  <LicenseBanner
                    classes="mb-3 small"
                    isAvailable={false}
                    showPaidFeatureBanner={
                      !featureAccess[routesWithTags(pathname)] || featureAccess?.licenseStatus?.licenseType === 'trial'
                    }
                    size="small"
                  />
                )}
              </div>
            </div>
          </div>
        )}
        <div className="col tj-dashboard-header-wrap">
          <div className="d-flex justify-content-sm-between tw-w-full">
            <div
              className="app-header-label tw-flex tw-items-center "
              data-cy={generateCypressDataCy(`breadcrumb-header-${pathname}`)}
            >
              <Breadcrumbs darkMode={darkMode} />
            </div>
            <div
              className={cx('tw-ml-auto tj-version tj-text-xsm tw-flex tw-items-center tw-gap-3', {
                'color-muted-darkmode': darkMode,
                'color-disabled': !darkMode,
              })}
            >
              <BranchingActionButtons />

              {Object.keys(featureAccess).length > 0 && (
                <LicenseBanner limits={featureAccess} showNavBarActions={true} />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
