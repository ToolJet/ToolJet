import React from 'react';
import cx from 'classnames';
import Breadcrumbs from '../Breadcrumbs';
import { OrganizationList } from '@/_components/OrganizationManager/List';
import { authenticationService } from '@/_services';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const { organization } = authenticationService.currentUserValue;

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        <div className="organization-selector col border-end border-bottom">
          {isSingleOrganization ? (
            <span className="d-flex align-items-center h-100">{organization}</span>
          ) : (
            <OrganizationList />
          )}
        </div>
        <div className="col border-bottom m-auto" style={{ padding: 13.5 }}>
          <div className="d-flex justify-content-sm-between">
            <div className="mr-3">
              <Breadcrumbs />
            </div>
            <div
              className={cx('ms-auto', {
                'color-muted-darkmode': darkMode,
                'color-disabled': !darkMode,
              })}
            >
              v{currentVersion}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
