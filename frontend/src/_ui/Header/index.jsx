import React from 'react';
import cx from 'classnames';
import { Breadcrumbs } from '../Breadcrumbs';
import { useLocation } from 'react-router-dom';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ToolTip } from '@/_components';

function Header({
  featureAccess,
  enableCollapsibleSidebar = false,
  collapseSidebar = false,
  toggleCollapsibleSidebar = () => {},
}) {
  const currentVersion = localStorage.getItem('currentVersion');
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const routes = (pathEnd, path) => {
    const pathParts = path.split('/');
    if (pathParts.length > 1) {
      const parentPath = pathParts[pathParts.length - 2];
      if (['workspace-settings', 'settings'].includes(parentPath)) {
        return parentPath === 'workspace-settings' ? 'Workspace settings' : 'Settings';
      }
    }
    switch (pathEnd) {
      case 'workspaceId':
        return 'Applications';
      case 'database':
        return 'Database';
      case 'workspace-settings':
      case 'users':
      case 'workspace-variables':
      case 'groups':
      case 'workspace-login':
        return 'Workspace settings';
      case 'data-sources':
        return 'Data sources';
      case 'profile-settings':
        return 'Profile settings';
      case 'installed':
      case 'marketplace':
        return 'Integrations';
      case 'settings':
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

  const routesWithTags = (pathEnd) => {
    switch (pathEnd) {
      case 'Audit logs':
        return 'auditLogs';
      default:
        return null;
    }
  };

  const location = useLocation();
  const pathname = routes(location?.pathname.split('/').pop(), location?.pathname);

  return (
    <header className="layout-header">
      <div className="row w-100 gx-0">
        {!collapseSidebar && (
          <div className="tj-dashboard-section-header" data-name={pathname}>
            <div className="row">
              <div className="col-9 d-flex">
                <p className="tj-text-md font-weight-500" data-cy="dashboard-section-header">
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
              {enableCollapsibleSidebar && !collapseSidebar && (
                <ToolTip message="Collapse sidebar" placement="bottom" delay={{ show: 0, hide: 100 }}>
                  <div className="col-3 px-3">
                    <ButtonSolid
                      variant="primary"
                      className="tj-text-xsm"
                      style={{
                        minWidth: '28px',
                        width: '28px',
                        height: '23px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: `${darkMode ? '#273E89' : 'var(--indigo3)'}`,
                        borderColor: `${darkMode ? 'rgba(62, 99, 221, 0.2)' : '#AEC0F5'} `,
                      }}
                      leftIcon="cheveronleftdouble"
                      fill="#3E63DD"
                      iconWidth="14"
                      size="md"
                      onClick={toggleCollapsibleSidebar}
                    ></ButtonSolid>
                  </div>
                </ToolTip>
              )}
            </div>
          </div>
        )}
        <div className="col tj-dashboard-header-wrap">
          <div className="d-flex justify-content-sm-between">
            {enableCollapsibleSidebar && collapseSidebar && (
              <ToolTip message="Open sidebar" placement="bottom" delay={{ show: 0, hide: 100 }}>
                <div className="pe-3">
                  <ButtonSolid
                    variant="primary"
                    className="tj-text-xsm"
                    style={{
                      minWidth: '28px',
                      width: '28px',
                      height: '23px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: `${darkMode ? '#273E89' : 'var(--indigo3)'}`,
                      borderColor: `${darkMode ? 'rgba(62, 99, 221, 0.2)' : '#AEC0F5'} `,
                    }}
                    leftIcon="cheveronrightdouble"
                    fill="#3E63DD"
                    iconWidth="14"
                    size="md"
                    onClick={toggleCollapsibleSidebar}
                  ></ButtonSolid>
                </div>
              </ToolTip>
            )}
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
