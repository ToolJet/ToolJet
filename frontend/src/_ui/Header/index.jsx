import React from 'react';
import cx from 'classnames';
import { Breadcrumbs } from '../Breadcrumbs';
import { useLocation } from 'react-router-dom';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const routes = (path) => {
    switch (path) {
      case 'workspaceId':
        return 'Applications';
      case 'database':
        return 'Database';
      case 'workspace-settings':
        return 'Workspace settings';
      case 'global-datasources':
        return 'Datasources';
      case 'settings':
        return 'Profile settings';
      case 'integrations':
        return 'Integrations';
      default:
        return 'Applications';
    }
  };
  const location = useLocation();

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        <div className="tj-dashboard-section-header">
          <p className="tj-text-md font-weight-500" data-cy="dashboard-section-header">
            {routes(location?.pathname.split('/').pop())}
          </p>
        </div>
        <div className="col tj-dashboard-header-wrap">
          <div className="d-flex justify-content-sm-between">
            <div className="app-header-label" data-cy="app-header-label">
              <Breadcrumbs darkMode={darkMode} />
            </div>
            <div
              className={cx('ms-auto tj-version tj-text-xsm', {
                'color-muted-darkmode': darkMode,
                'color-disabled': !darkMode,
              })}
              data-cy="version-label"
            >
              Version {currentVersion}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
