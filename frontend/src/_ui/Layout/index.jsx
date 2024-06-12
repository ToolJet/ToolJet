import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import { ToolTip } from '@/_components/ToolTip';
import { Profile } from '@/_components/Profile';
import { NotificationCenter } from '@/_components/NotificationCenter';
import Logo from '@assets/images/rocket.svg';
import Header from '../Header';
import { authenticationService, licenseService, whiteLabellingService } from '@/_services';
import SolidIcon from '../Icon/SolidIcons';
import { getPrivateRoute } from '@/_helpers/routes';
import { LicenseTooltip } from '@/LicenseTooltip';
import { ConfirmDialog } from '@/_components';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import Beta from '../Beta';
import Settings from '@/_components/Settings';
import './styles.scss';
import { useLicenseState, useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import { retrieveWhiteLabelLogo, fetchWhiteLabelDetails } from '@white-label/whiteLabelling';

function Layout({
  children,
  switchDarkMode,
  darkMode,
  enableCollapsibleSidebar = false,
  collapseSidebar = false,
  toggleCollapsibleSidebar = () => {},
}) {
  const router = useRouter();
  const { featureAccess } = useLicenseStore(
    (state) => ({
      featureAccess: state.featureAccess,
    }),
    shallow
  );
  fetchWhiteLabelDetails();
  const whiteLabelLogo = retrieveWhiteLabelLogo();
  let licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;

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

  useEffect(() => {
    useLicenseStore.getState().actions.fetchFeatureAccess();
  }, []);

  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const super_admin = currentUserValue?.super_admin;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';
  const hasCommonPermissions =
    canReadDataSource() ||
    canUpdateDataSource() ||
    canCreateDataSource() ||
    canDeleteDataSource() ||
    admin ||
    super_admin;
  const isAuthorizedForGDS = (hasCommonPermissions && licenseValid) || (!licenseValid && (admin || super_admin));

  const {
    checkForUnsavedChanges,
    handleDiscardChanges,
    handleSaveChanges,
    handleContinueEditing,
    unSavedModalVisible,
    nextRoute,
  } = useGlobalDatasourceUnsavedChanges();
  const workflowsEnabled = admin && window.public_config?.ENABLE_WORKFLOWS_FEATURE == 'true';

  const canCreateVariableOrConstant = () => {
    return (
      canAnyGroupPerformAction(
        'org_environment_variable_create',
        authenticationService.currentSessionValue.group_permissions
      ) || admin
    );
  };

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
                {whiteLabelLogo ? <img src={whiteLabelLogo} /> : <Logo />}
              </Link>
            </div>
            <div>
              <ul className="sidebar-inner nav nav-vertical">
                <li className="text-center cursor-pointer">
                  <ToolTip message="Apps" placement="right">
                    <Link
                      to={getPrivateRoute('dashboard')}
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
                            : 'var(--slate8)'
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
                        onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workflows'), event)}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('workflows') && `current-seleted-route`
                        }`}
                        data-cy="icon-workflows"
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
                    <ToolTip message="ToolJet Database" placement="right">
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
                              : 'var(--slate8)'
                          }
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}

                {/* DATASOURCES */}
                {isAuthorizedForGDS && (
                  <li className="text-center cursor-pointer">
                    <ToolTip message="Data sources" placement="right">
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
                          fill={router.pathname === getPrivateRoute('data_sources') ? '#3E63DD' : 'var(--slate8)'}
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}
                {canCreateVariableOrConstant() && (
                  <li className="text-center cursor-pointer">
                    <ToolTip message="Workspace constants" placement="right">
                      <Link
                        to={getPrivateRoute('workspace_constants')}
                        onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workspace_constants'), event)}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('workspace_constants') && `current-seleted-route`
                        }`}
                        data-cy="icon-workspace-constants"
                      >
                        <SolidIcon
                          name="workspaceconstants"
                          fill={
                            router.pathname === getPrivateRoute('workspace_constants') ? '#3E63DD' : 'var(--slate8)'
                          }
                          width={25}
                          viewBox={'0 0 20 20'}
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}

                <li className="tj-leftsidebar-icon-items-bottom text-center">
                  <NotificationCenter darkMode={darkMode} />
                  <ToolTip delay={{ show: 0, hide: 0 }} message="Mode" placement="right">
                    <Link
                      className="cursor-pointer tj-leftsidebar-icon-items"
                      onClick={() => switchDarkMode(!darkMode)}
                      data-cy="mode-switch-button"
                    >
                      <SolidIcon name={darkMode ? 'lightmode' : 'darkmode'} fill="var(--slate8)" />
                    </Link>
                  </ToolTip>
                  <Settings
                    featureAccess={featureAccess}
                    darkMode={darkMode}
                    checkForUnsavedChanges={checkForUnsavedChanges}
                  />
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <div style={{ paddingLeft: 48, paddingRight: 0 }} className="col">
        <Header
          featureAccess={featureAccess}
          enableCollapsibleSidebar={enableCollapsibleSidebar}
          collapseSidebar={collapseSidebar}
          toggleCollapsibleSidebar={toggleCollapsibleSidebar}
        />
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
