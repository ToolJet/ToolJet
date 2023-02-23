import React from 'react';
import cx from 'classnames';
import Breadcrumbs from '../Breadcrumbs';
import { OrganizationList } from '@/_components/OrganizationManager/List';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        <div className="organization-selector col border-end border-bottom" data-cy="workspace-selector">
          <OrganizationList />
        </div>
        <div className="col border-bottom m-auto" style={{ padding: 13.5 }}>
          <div className="d-flex justify-content-sm-between">
            <div className="mr-3" data-cy="app-header-label">
              <Breadcrumbs />
            </div>
            <div
              className={cx('ms-auto', {
                'color-muted-darkmode': darkMode,
                'color-disabled': !darkMode,
              })}
              data-cy="version-label"
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
