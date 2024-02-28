import React from 'react';
import cx from 'classnames';
import { Breadcrumbs } from '../Breadcrumbs';
import { useLocation } from 'react-router-dom';

// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';

function Header() {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const routes = (path) => {
    switch (path) {
      case 'workspaceId':
        return i18next.t('_ui.breadcrumbs.apps', 'Applications');
      case 'database':
        return i18next.t('_ui.breadcrumbs.apps', 'Database');
      case 'workspace-settings':
        return i18next.t('_ui.breadcrumbs.workspaceSettings', 'Workspace settings');
      case 'data-sources':
        return i18next.t('_ui.breadcrumbs.ds', 'Data sources');
      case 'settings':
        return i18next.t('_ui.breadcrumbs.profileSettings', 'Profile settings');
      case 'integrations':
        return i18next.t('_ui.breadcrumbs.integrations', 'Integrations');
      case 'workspace-constants':
        return i18next.t('_ui.breadcrumbs.worspaceCont', 'Workspace constants');
      default:
        return i18next.t('_ui.breadcrumbs.apps', 'Applications');
    }
  };
  const location = useLocation();
  const pathname = routes(location?.pathname.split('/').pop());

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
              {i18next.t('_ui.header.version', 'Version')} {currentVersion}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
