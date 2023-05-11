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
                <li className="text-center mt-3 cursor-pointer">
                  <Link to={getPrivateRoute('workspace_settings')}>
                    <ToolTip message="Workspace settings" placement="right">
                      <svg
                        className="layout-sidebar-icon"
                        width="32"
                        height="33"
                        viewBox="0 0 32 33"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        data-cy="workspace-settings-icon"
                      >
                        <rect
                          y="0.326172"
                          width="32"
                          height="32"
                          rx="4"
                          fill={router.pathname === getPrivateRoute('workspace_settings') ? '#E6EDFE' : '#none'}
                        />
                        <g clipPath="url(#clip0_453_63684)">
                          <path
                            d="M16.0005 26.3262C14.7205 26.3262 13.6505 25.4862 13.3505 24.2462C13.2605 23.8562 12.8705 23.6262 12.4705 23.7162C12.4005 23.7362 12.3305 23.7662 12.2605 23.8062C11.1705 24.4762 9.82047 24.3062 8.92047 23.4062C8.01047 22.4962 7.85047 21.1562 8.52047 20.0662C8.62047 19.8962 8.65047 19.7062 8.60047 19.5162C8.55047 19.3262 8.44047 19.1662 8.27047 19.0662C8.21047 19.0262 8.14047 18.9962 8.06047 18.9762C6.82047 18.6762 5.98047 17.6062 5.98047 16.3262C5.98047 15.0462 6.82047 13.9762 8.06047 13.6762C8.45047 13.5862 8.69047 13.1862 8.59047 12.8062C8.57047 12.7362 8.54047 12.6662 8.50047 12.5962C7.83047 11.5062 7.99047 10.1562 8.90047 9.25617C9.81047 8.34617 11.1505 8.18617 12.2405 8.85617C12.4405 8.97617 12.6805 8.99617 12.8905 8.90617C13.1005 8.81617 13.2605 8.63617 13.3205 8.40617C13.6205 7.16617 14.6905 6.32617 15.9705 6.32617C17.2505 6.32617 18.3105 7.16617 18.6205 8.40617C18.7105 8.79617 19.1105 9.03617 19.4905 8.93617C19.5605 8.91617 19.6305 8.88617 19.7005 8.84617C20.8005 8.17617 22.1405 8.34617 23.0405 9.24617C23.9505 10.1562 24.1105 11.4962 23.4405 12.5862C23.3405 12.7562 23.3105 12.9462 23.3505 13.1362C23.3905 13.3262 23.5105 13.4862 23.6805 13.5862C23.7405 13.6262 23.8105 13.6562 23.8905 13.6662C25.1305 13.9662 25.9705 15.0362 25.9705 16.3162C25.9705 17.5962 25.1305 18.6562 23.8905 18.9662C23.5005 19.0562 23.2605 19.4562 23.3605 19.8362C23.3805 19.9062 23.4105 19.9762 23.4505 20.0462C24.1205 21.1362 23.9505 22.4862 23.0505 23.3862C22.1505 24.2862 20.8005 24.4562 19.7105 23.7862C19.5405 23.6862 19.3505 23.6562 19.1605 23.6962C18.9705 23.7362 18.8105 23.8562 18.7105 24.0262C18.6705 24.0962 18.6405 24.1562 18.6205 24.2362C18.3205 25.4762 17.2505 26.3162 15.9705 26.3162L16.0005 26.3262ZM12.6505 21.6962C13.8805 21.6962 15.0005 22.5362 15.3005 23.7762C15.4205 24.2862 15.8705 24.3262 16.0005 24.3262C16.1305 24.3262 16.5805 24.2862 16.7005 23.7762C16.7705 23.4962 16.8705 23.2362 17.0205 22.9962C17.4005 22.3762 17.9905 21.9362 18.7005 21.7662C19.4105 21.5962 20.1405 21.7062 20.7605 22.0862C21.2105 22.3562 21.5505 22.0762 21.6505 21.9762C21.7405 21.8862 22.0305 21.5362 21.7605 21.0862C21.6105 20.8462 21.5005 20.5862 21.4405 20.3062C21.0905 18.8462 21.9905 17.3762 23.4405 17.0162C23.9505 16.8962 23.9905 16.4462 23.9905 16.3162C23.9905 16.1862 23.9505 15.7362 23.4405 15.6162C23.1705 15.5462 22.9105 15.4462 22.6705 15.2962C22.0505 14.9162 21.6105 14.3162 21.4405 13.6162C21.2705 12.9062 21.3805 12.1762 21.7605 11.5562C22.0305 11.1062 21.7505 10.7662 21.6505 10.6662C21.5605 10.5762 21.2105 10.2862 20.7605 10.5562C20.5205 10.7062 20.2605 10.8162 19.9805 10.8762C18.5205 11.2262 17.0505 10.3262 16.6905 8.86617C16.5705 8.35617 16.1205 8.31617 15.9905 8.31617C15.8605 8.31617 15.4105 8.35617 15.2905 8.86617C15.0805 9.71617 14.5005 10.4062 13.6905 10.7362C12.8805 11.0762 11.9805 11.0062 11.2305 10.5462C10.7805 10.2762 10.4305 10.5562 10.3405 10.6562C10.2505 10.7462 9.96047 11.0962 10.2305 11.5462C10.3805 11.7862 10.4905 12.0462 10.5505 12.3262C10.9005 13.7862 10.0005 15.2662 8.54047 15.6162C8.03047 15.7362 7.99047 16.1862 7.99047 16.3162C7.99047 16.4462 8.03047 16.8962 8.54047 17.0162C8.82047 17.0862 9.08047 17.1962 9.32047 17.3362C10.6005 18.1162 11.0105 19.7962 10.2305 21.0762C9.96047 21.5262 10.2405 21.8662 10.3405 21.9662C10.4405 22.0662 10.7805 22.3462 11.2305 22.0762C11.4705 21.9262 11.7305 21.8162 12.0105 21.7562C12.2205 21.7062 12.4405 21.6762 12.6505 21.6762V21.6962Z"
                            fill={router.pathname === getPrivateRoute('workspace_settings') ? '#3E63DD' : '#C1C8CD'}
                          />
                          <path
                            d="M16.0005 20.3262C13.7905 20.3262 12.0005 18.5362 12.0005 16.3262C12.0005 14.1162 13.7905 12.3262 16.0005 12.3262C18.2105 12.3262 20.0005 14.1162 20.0005 16.3262C20.0005 18.5362 18.2105 20.3262 16.0005 20.3262ZM16.0005 14.3262C14.9005 14.3262 14.0005 15.2262 14.0005 16.3262C14.0005 17.4262 14.9005 18.3262 16.0005 18.3262C17.1005 18.3262 18.0005 17.4262 18.0005 16.3262C18.0005 15.2262 17.1005 14.3262 16.0005 14.3262Z"
                            fill={router.pathname === getPrivateRoute('workspace_settings') ? '#3E63DD' : '#C1C8CD'}
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_453_63684">
                            <rect width="20" height="20" fill="white" transform="translate(6 6.32617)" />
                          </clipPath>
                        </defs>
                      </svg>
                    </ToolTip>
                  </Link>
                </li>
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
                <li className="m-auto">
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
                  <Profile switchDarkMode={switchDarkMode} darkMode={darkMode} />
                </li>
                <li className="tj-leftsidebar-icon-items-bottom text-center">
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
