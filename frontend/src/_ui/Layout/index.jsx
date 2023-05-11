import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import { ToolTip } from '@/_components/ToolTip';
import { Profile } from '@/_components/Profile';
import { NotificationCenter } from '@/_components/NotificationCenter';
import Logo from '@assets/images/rocket.svg';
import Header from '../Header';
import { authenticationService, auditLogsService } from '@/_services';
import config from 'config';
import SolidIcon from '../Icon/SolidIcons';
import { getPrivateRoute } from '@/_helpers/routes';

function Layout({ children, switchDarkMode, darkMode }) {
  const router = useRouter();
  const navigate = useNavigate();

  function handleAuditLogClick() {
    auditLogsService.getLicenseTerms().then(() => navigate(getPrivateRoute('audit_logs')));
    document.activeElement.blur();
    return;
  }

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
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

  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const super_admin = currentUserValue?.super_admin;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';

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
                  <li className="text-center mt-3 cursor-pointer">
                    <Link to="/instance-settings">
                      <ToolTip message="Instance settings" placement="right">
                        <svg
                          className="layout-sidebar-icon"
                          width="32"
                          height="33"
                          viewBox="0 0 32 33"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            y="0.326172"
                            width="32"
                            height="32"
                            rx="4"
                            fill={router.pathname === '/instance-settings' ? '#E6EDFE' : '#none'}
                          />
                          <g clipPath="url(#clip0_941_122397)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M6 5C4.89543 5 4 5.89543 4 7V9C4 10.1046 4.89543 11 6 11H18C19.1046 11 20 10.1046 20 9V7C20 5.89543 19.1046 5 18 5H6ZM6 13C5.46957 13 4.96086 13.2107 4.58579 13.5858C4.21071 13.9609 4 14.4696 4 15V17C4 17.5304 4.21071 18.0391 4.58579 18.4142C4.96086 18.7893 5.46957 19 6 19H12C12.5523 19 13 19.4477 13 20C13 20.5523 12.5523 21 12 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V15C2 13.9391 2.42143 12.9217 3.17157 12.1716C3.23082 12.1123 3.29174 12.0551 3.35421 12C2.52377 11.2671 2 10.1947 2 9V7C2 4.79086 3.79086 3 6 3H18C20.2091 3 22 4.79086 22 7V9C22 11.2091 20.2091 13 18 13H6ZM7 7C7.55228 7 8 7.44772 8 8V8.01C8 8.56228 7.55228 9.01 7 9.01C6.44772 9.01 6 8.56228 6 8.01V8C6 7.44772 6.44772 7 7 7ZM18.001 13.5C18.5533 13.5 19.001 13.9477 19.001 14.5V15.1707C19.3521 15.2948 19.6732 15.4824 19.9505 15.7197L20.532 15.384C21.0103 15.1078 21.6219 15.2717 21.898 15.75C22.1742 16.2283 22.0103 16.8399 21.532 17.116L20.951 17.4515C20.9838 17.6293 21.001 17.8127 21.001 18C21.001 18.1872 20.9838 18.3705 20.951 18.5482L21.5327 18.8838C22.0111 19.1598 22.1752 19.7713 21.8992 20.2497C21.6232 20.7281 21.0117 20.8922 20.5333 20.6162L19.9507 20.2801C19.6734 20.5175 19.3522 20.7052 19.001 20.8293V21.5C19.001 22.0523 18.5533 22.5 18.001 22.5C17.4487 22.5 17.001 22.0523 17.001 21.5V20.8293C16.65 20.7052 16.3289 20.5177 16.0517 20.2804L15.4697 20.6162C14.9913 20.8922 14.3798 20.7281 14.1038 20.2497C13.8278 19.7713 13.9919 19.1598 14.4703 18.8838L15.0511 18.5487C15.0182 18.3708 15.001 18.1874 15.001 18C15.001 17.8126 15.0182 17.6292 15.0511 17.4513L14.4703 17.1162C13.9919 16.8402 13.8278 16.2287 14.1038 15.7503C14.3798 15.2719 14.9913 15.1078 15.4697 15.3838L16.0517 15.7196C16.3289 15.4823 16.65 15.2948 17.001 15.1707V14.5C17.001 13.9477 17.4487 13.5 18.001 13.5ZM17.1187 17.5289C17.1247 17.5193 17.1305 17.5096 17.1362 17.4997C17.1415 17.4905 17.1467 17.4812 17.1517 17.4718C17.3283 17.1885 17.6426 17 18.001 17C18.3661 17 18.6854 17.1956 18.86 17.4877C18.8623 17.4918 18.8646 17.4959 18.867 17.5C18.8695 17.5044 18.872 17.5087 18.8746 17.513C18.9551 17.6571 19.001 17.8232 19.001 18C19.001 18.1768 18.9551 18.3429 18.8746 18.487C18.872 18.4914 18.8694 18.4958 18.8668 18.5003C18.8645 18.5043 18.8622 18.5083 18.86 18.5123C18.6854 18.8044 18.3661 19 18.001 19C17.6426 19 17.3283 18.8115 17.1517 18.5282C17.1467 18.5188 17.1415 18.5095 17.1362 18.5003C17.1305 18.4904 17.1247 18.4807 17.1187 18.4711C17.0436 18.3307 17.001 18.1703 17.001 18C17.001 17.8297 17.0436 17.6693 17.1187 17.5289ZM7 15C7.55228 15 8 15.4477 8 16V16.01C8 16.5623 7.55228 17.01 7 17.01C6.44772 17.01 6 16.5623 6 16.01V16C6 15.4477 6.44772 15 7 15Z"
                              fill={router.pathname === '/instance-settings' ? '#3E63DD' : '#C1C8CD'}
                              transform="translate(4 4.32617)"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_453_63684">
                              <rect width="20" height="20" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </ToolTip>
                    </Link>
                  </li>
                )}
                <li className="tj-leftsidebar-icon-items-bottom text-center">
                  {admin && (
                    <ToolTip message="Audit Logs" placement="right">
                      <Link className="layout-sidebar-icon audit-logs-nav-item" onClick={handleAuditLogClick}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect
                            y="0.326172"
                            width="32"
                            height="32"
                            rx="4"
                            fill={router.pathname === getPrivateRoute('audit_logs') ? '#E6EDFE' : '#none'}
                          />
                          <g clipPath="url(#clip0_453_63684)">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11 9C10.7348 9 10.4804 9.10536 10.2929 9.29289C10.1054 9.48043 10 9.73478 10 10V22C10 22.2652 10.1054 22.5196 10.2929 22.7071C10.4804 22.8946 10.7348 23 11 23H13.615C14.1673 23 14.615 23.4477 14.615 24C14.615 24.5523 14.1673 25 13.615 25H11C10.2044 25 9.44129 24.6839 8.87868 24.1213C8.31607 23.5587 8 22.7956 8 22V10C8 9.20435 8.31607 8.44129 8.87868 7.87868C9.44129 7.31607 10.2044 7 11 7H19C19.7956 7 20.5587 7.31607 21.1213 7.87868C21.6839 8.44129 22 9.20435 22 10V18C22 18.5523 21.5523 19 21 19C20.4477 19 20 18.5523 20 18V10C20 9.73478 19.8946 9.48043 19.7071 9.29289C19.5196 9.10536 19.2652 9 19 9H11ZM12 12C12 11.4477 12.4477 11 13 11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H13C12.4477 13 12 12.5523 12 12ZM12 16C12 15.4477 12.4477 15 13 15H15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17H13C12.4477 17 12 16.5523 12 16ZM24.7071 20.2929C25.0976 20.6834 25.0976 21.3166 24.7071 21.7071L20.7071 25.7071C20.3166 26.0976 19.6834 26.0976 19.2929 25.7071L17.2929 23.7071C16.9024 23.3166 16.9024 22.6834 17.2929 22.2929C17.6834 21.9024 18.3166 21.9024 18.7071 22.2929L20 23.5858L23.2929 20.2929C23.6834 19.9024 24.3166 19.9024 24.7071 20.2929Z"
                              fill={router.pathname === getPrivateRoute('audit_logs') ? '#3E63DD' : '#C1C8CD'}
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_453_63684">
                              <rect width="20" height="20" fill="white" transform="translate(6 6.32617)" />
                            </clipPath>
                          </defs>
                        </svg>
                      </Link>
                    </ToolTip>
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
