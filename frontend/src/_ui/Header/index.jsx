import React from 'react';
import cx from 'classnames';
import Breadcrumbs from '../Breadcrumbs';
import { useLocation } from 'react-router-dom';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const routes = (path) => {
    switch (path) {
      case '/':
        return 'Applications';
      case '/database':
        return 'Tables';
      case '/workspace-settings':
        return 'Workspace settings';
      default:
        return;
    }
  };
  const location = useLocation();

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        <div className="tj-dashboard-section-header">
          <p className="tj-para-md">{routes(location?.pathname)}</p>
        </div>
        <div className="col tj-dashboard-header-wrap">
          <div className="d-flex justify-content-sm-between">
            <div className="app-header-label" data-cy="app-header-label">
              <Breadcrumbs />
            </div>
            <div
              className={cx('ms-auto tj-version tj-text-xsm', {
                'color-muted-darkmode': darkMode,
                'color-disabled': !darkMode,
              })}
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
