import React from 'react';
import cx from 'classnames';
import { Breadcrumbs } from '../Breadcrumbs';
import { useLocation } from 'react-router-dom';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const routes = (pathEnd, path) => {
    const pathParts = path.split('/');
    if (pathParts.length > 1) {
      const parentPath = pathParts[pathParts.length - 2];
      if (['workspace-settings', 'instance-settings'].includes(parentPath)) {
        return parentPath === 'workspace-settings' ? 'Workspace settings' : 'Settings';
      }
    }
    switch (pathEnd) {
      case 'workspaceId':
        return 'Applications';
      case 'database':
        return 'Database';
      case 'workspace-settings':
        return 'Workspace settings';
      case 'data-sources':
        return 'Data sources';
      case 'settings':
        return 'Profile settings';
      case 'integrations':
        return 'Integrations';
      case 'instance-settings':
        return 'Settings';
      case 'audit-logs':
        return 'Audit logs';
      case 'workflows':
        return 'Workflows';
      case 'workspace-constants':
        return 'Workspace constants';
      default:
        return 'Applications';
    }
  };
  const location = useLocation();
  const pathname = routes(location?.pathname.split('/').pop(), location?.pathname);

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        <div className="tj-dashboard-section-header" data-name={pathname}>
          <p className="tj-text-md font-weight-500" data-cy="dashboard-section-header">
            {pathname}
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
