import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import { ToolTip } from '@/_components/ToolTip';
import { Profile } from '@/_components/Profile';
import { NotificationCenter } from '@/_components/NotificationCenter';
import Logo from '@assets/images/rocket.svg';
import Header from '../Header';
import { authenticationService } from '@/_services';
import SolidIcon from '../Icon/SolidIcons';
import { getPrivateRoute } from '@/_helpers/routes';
import { ConfirmDialog } from '@/_components';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';

function Layout({ children, switchDarkMode, darkMode }) {
  const router = useRouter();
  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';

  const {
    checkForUnsavedChanges,
    handleDiscardChanges,
    handleSaveChanges,
    handleContinueEditing,
    unSavedModalVisible,
    nextRoute,
  } = useGlobalDatasourceUnsavedChanges();

  return (
    <div className="row m-auto">
      <div className="col-auto p-0">
        <aside className="left-sidebar h-100 position-fixed">
          <div className="tj-leftsidebar-icon-wrap">
            <div className="application-brand" data-cy={`home-page-logo`}>
              <Link
                to={getPrivateRoute('dashboard')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('dashboard'), event)}
              >
                <Logo />
              </Link>
            </div>
            <div>
              <ul className="sidebar-inner nav nav-vertical">
                <li className="text-center cursor-pointer">
                  <ToolTip message="Dashboard" placement="right">
                    <Link
                      to="/"
                      onClick={(event) => checkForUnsavedChanges(getPrivateRoute('dashboard'), event)}
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
                        onClick={(event) => checkForUnsavedChanges(getPrivateRoute('database'), event)}
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
                {admin && (
                  <li className="text-center cursor-pointer">
                    <ToolTip message="Data Sources" placement="right">
                      <Link
                        to={getPrivateRoute('data_sources')}
                        onClick={(event) => checkForUnsavedChanges(getPrivateRoute('data_sources'), event)}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('data_sources') && `current-seleted-route`
                        }`}
                        data-cy="icon-global-datasources"
                      >
                        <SolidIcon
                          name="datasource"
                          fill={
                            router.pathname === getPrivateRoute('data_sources')
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
                        onClick={(event) => checkForUnsavedChanges(getPrivateRoute('integrations'), event)}
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
                      onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workspace_settings'), event)}
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
                    <Profile
                      checkForUnsavedChanges={checkForUnsavedChanges}
                      switchDarkMode={switchDarkMode}
                      darkMode={darkMode}
                    />
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
      <ConfirmDialog
        title={'Unsaved Changes'}
        show={unSavedModalVisible}
        message={'Datasource has unsaved changes. Are you sure you want to discard them?'}
        onConfirm={() => handleDiscardChanges(nextRoute)}
        onCancel={handleSaveChanges}
        confirmButtonText={'Discard'}
        cancelButtonText={'Save changes'}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        backdropClassName="datasource-selection-confirm-backdrop"
        onCloseIconClick={handleContinueEditing}
      />
    </div>
  );
}

export default Layout;
