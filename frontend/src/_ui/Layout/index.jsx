import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import { ToolTip } from '@/_components/ToolTip';
import { Profile } from '@/_components/Profile';
import { NotificationCenter } from '@/_components/NotificationCenter';
import Logo from '@assets/images/rocket.svg';
import Header from '../Header';
import { authenticationService, licenseService } from '@/_services';
import SolidIcon from '../Icon/SolidIcons';
import { getPrivateRoute } from '@/_helpers/routes';
import { LicenseTooltip } from '@/LicenseTooltip';
import Beta from '../Beta';
import './styles.scss';

function Layout({ children, switchDarkMode, darkMode }) {
  const router = useRouter();
  const [featureAccess, setFeatureAccess] = useState({});

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess({ ...data });
    });
  };

  const canCreateDataSource = () => {
    return (
      canAnyGroupPerformAction('data_source_create', currentUserValue.group_permissions) || currentUserValue.super_admin
    );
  };

  const canUpdateDataSource = () => {
    return (
      canAnyGroupPerformAction('update', currentUserValue.data_source_group_permissions) || currentUserValue.super_admin
    );
  };

  const canReadDataSource = () => {
    return (
      canAnyGroupPerformAction('read', currentUserValue.data_source_group_permissions) || currentUserValue.super_admin
    );
  };

  const canDeleteDataSource = () => {
    return (
      canAnyGroupPerformAction('data_source_delete', currentUserValue.group_permissions) || currentUserValue.super_admin
    );
  };

  useEffect(() => {
    fetchFeatureAccess();
  }, []);

  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const super_admin = currentUserValue?.super_admin;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';
  const workflowsEnabled = admin && window.public_config?.ENABLE_WORKFLOWS_FEATURE == 'true';

  return (
    <div className="row m-auto">
      <div className="col-auto p-0">
        <aside className="left-sidebar h-100 position-fixed">
          <div className="tj-leftsidebar-icon-wrap">
            <div className="application-brand" data-cy={`home-page-logo`}>
              <Link to={getPrivateRoute('dashboard')}>
                {window.public_config?.WHITE_LABEL_LOGO ? (
                  <img src={window.public_config?.WHITE_LABEL_LOGO} height={26} />
                ) : (
                  <Logo />
                )}
              </Link>
            </div>
            <div>
              <ul className="sidebar-inner nav nav-vertical">
                <li className="text-center cursor-pointer">
                  <ToolTip message="Dashboard" placement="right">
                    <Link
                      to={getPrivateRoute('dashboard')}
                      className={`tj-leftsidebar-icon-items  ${
                        (router.pathname === '/:workspaceId' || router.pathname === getPrivateRoute('dashboard')) &&
                        `current-seleted-route`
                      }`}
                      data-cy="icon-dashboard"
                    >
                      <SolidIcon
                        name="apps"
                        fill={
                          router.pathname === '/:workspaceId' || router.pathname === getPrivateRoute('dashboard')
                            ? '#3E63DD'
                            : darkMode
                            ? '#4C5155'
                            : '#C1C8CD'
                        }
                      />
                    </Link>
                  </ToolTip>
                </li>
                {workflowsEnabled && (
                  <li className="text-center  cursor-pointer" data-cy={`database-icon`}>
                    <ToolTip message="Workflows" placement="right">
                      <Link
                        to={getPrivateRoute('workflows')}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('workflows') && `current-seleted-route`
                        }`}
                        data-cy="icon-database"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: 'fit-content',
                          gap: '4px',
                          padding: '8px',
                        }}
                      >
                        <SolidIcon
                          name="workflows"
                          fill={
                            router.pathname === getPrivateRoute('workflows') && `current-seleted-route`
                              ? '#3E63DD'
                              : darkMode
                              ? '#4C5155'
                              : '#C1C8CD'
                          }
                        />
                        <Beta className="workflows-beta-tag" />
                      </Link>
                    </ToolTip>
                  </li>
                )}
                {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
                  <li className="text-center  cursor-pointer" data-cy={`database-icon`}>
                    <ToolTip message="Database" placement="right">
                      <Link
                        to={getPrivateRoute('database')}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('database') && `current-seleted-route`
                        }`}
                        data-cy="icon-database"
                      >
                        <SolidIcon
                          name="table"
                          fill={
                            router.pathname === getPrivateRoute('database') && `current-seleted-route`
                              ? '#3E63DD'
                              : darkMode
                              ? '#4C5155'
                              : '#C1C8CD'
                          }
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}

                {/* DATASOURCES */}
                {(canReadDataSource() ||
                  canUpdateDataSource() ||
                  canCreateDataSource() ||
                  canDeleteDataSource() ||
                  admin ||
                  super_admin) && (
                  <li className="text-center cursor-pointer">
                    <ToolTip message="Global Datasources" placement="right">
                      <Link
                        to={getPrivateRoute('global_datasources')}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('global_datasources') && `current-seleted-route`
                        }`}
                        data-cy="icon-global-datasources"
                      >
                        <SolidIcon
                          name="datasource"
                          fill={
                            router.pathname === getPrivateRoute('global_datasources')
                              ? '#3E63DD'
                              : darkMode
                              ? '#4C5155'
                              : '#C1C8CD'
                          }
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}
                {marketplaceEnabled && (
                  <li className="text-center d-flex flex-column">
                    <ToolTip message="Marketplace (Beta)" placement="right">
                      <Link
                        to="/integrations"
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === '/integrations' && `current-seleted-route`
                        }`}
                        data-cy="icon-marketplace"
                      >
                        <SolidIcon
                          name="marketplace"
                          fill={router.pathname === '/integrations' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}
                <li className="text-center cursor-pointer">
                  <ToolTip message="Workspace settings" placement="right">
                    <Link
                      to={getPrivateRoute('workspace_settings')}
                      className={`tj-leftsidebar-icon-items  ${
                        router.pathname === getPrivateRoute('workspace_settings') && `current-seleted-route`
                      }`}
                      data-cy="icon-workspace-settings"
                    >
                      <SolidIcon
                        name="setting"
                        fill={
                          router.pathname === getPrivateRoute('workspace_settings')
                            ? '#3E63DD'
                            : darkMode
                            ? '#4C5155'
                            : '#C1C8CD'
                        }
                      />
                    </Link>
                  </ToolTip>
                </li>
                {super_admin && (
                  <li className="text-center cursor-pointer">
                    <ToolTip message="Instance settings" placement="right">
                      <Link
                        to="/instance-settings"
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === '/instance-settings' && `current-seleted-route`
                        }`}
                        data-cy="icon-instance-settings"
                      >
                        <SolidIcon
                          name="instancesettings"
                          fill={router.pathname === '/instance-settings' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}
                <li className="tj-leftsidebar-icon-items-bottom text-center">
                  {admin && (
                    <LicenseTooltip
                      limits={featureAccess}
                      feature={'Audit Logs'}
                      isAvailable={featureAccess?.auditLogs}
                    >
                      <Link
                        to={
                          featureAccess?.auditLogs &&
                          !featureAccess?.licenseStatus?.isExpired &&
                          featureAccess?.licenseStatus?.isLicenseValid &&
                          getPrivateRoute('audit_logs')
                        }
                        className={`tj-leftsidebar-icon-items ${
                          router.pathname === getPrivateRoute('audit_logs') && `current-seleted-route`
                        }`}
                        data-cy="icon-audit-logs"
                      >
                        <SolidIcon
                          name="auditlogs"
                          fill={
                            router.pathname === getPrivateRoute('audit_logs')
                              ? '#3E63DD'
                              : darkMode
                              ? '#4C5155'
                              : '#C1C8CD'
                          }
                        />
                      </Link>
                    </LicenseTooltip>
                  )}
                  <NotificationCenter darkMode={darkMode} />
                  <ToolTip message="Mode" placement="right">
                    <div
                      className="cursor-pointer  tj-leftsidebar-icon-items"
                      onClick={() => switchDarkMode(!darkMode)}
                      data-cy="mode-switch-button"
                    >
                      <SolidIcon name={darkMode ? 'lightmode' : 'darkmode'} fill={darkMode ? '#4C5155' : '#C1C8CD'} />
                    </div>
                  </ToolTip>

                  <ToolTip message="Profile" placement="right">
                    <Profile switchDarkMode={switchDarkMode} darkMode={darkMode} />
                  </ToolTip>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <div style={{ paddingLeft: 56, paddingRight: 0 }} className="col">
        <Header />
        <div style={{ paddingTop: 64 }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
