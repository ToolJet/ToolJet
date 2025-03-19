import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import Logo from '@assets/images/tj-logo.svg';
import Header from '../Header';
import { authenticationService } from '@/_services';
import { getPrivateRoute } from '@/_helpers/routes';
import { ConfirmDialog } from '@/_components';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import './styles.scss';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import { retrieveWhiteLabelLogo } from '@white-label/whiteLabelling';
import '../../_styles/left-sidebar.scss';
import { hasBuilderRole } from '@/_helpers/utils';
import { LeftNavSideBar } from '@/modules/common/components';

function Layout({
  children,
  switchDarkMode,
  darkMode,
  enableCollapsibleSidebar = false,
  collapseSidebar = false,
  toggleCollapsibleSidebar = () => {},
}) {
  const [licenseValid, setLicenseValid] = useState(false);
  const logo = retrieveWhiteLabelLogo();
  const router = useRouter();
  const { featureAccess } = useLicenseStore(
    (state) => ({
      featureAccess: state.featureAccess,
    }),
    shallow
  );

  const canAnyGroupPerformAction = (action) => {
    let { user_permissions, data_source_group_permissions, super_admin, admin } =
      authenticationService.currentSessionValue;
    const canCreateDataSource = super_admin || admin || user_permissions?.data_source_create;
    const canDeleteDataSource = super_admin || admin || user_permissions?.data_source_delete;
    const canConfigureDataSource =
      canCreateDataSource ||
      data_source_group_permissions?.is_all_configurable ||
      data_source_group_permissions?.configurable_data_source_id?.length;
    const canUseDataSource =
      canConfigureDataSource ||
      data_source_group_permissions?.is_all_usable ||
      data_source_group_permissions?.usable_data_sources_id?.length;

    switch (action) {
      case 'data_source_create':
        return canCreateDataSource;
      case 'data_source_delete':
        return canDeleteDataSource;
      case 'read':
        return canUseDataSource;
      case 'update':
        return canConfigureDataSource;
      default:
        return false;
    }
  };

  const canCreateDataSource = () => {
    return canAnyGroupPerformAction('data_source_create');
  };

  const canUpdateDataSource = () => {
    return canAnyGroupPerformAction('update');
  };

  const canReadDataSource = () => {
    return canAnyGroupPerformAction('read');
  };

  const canDeleteDataSource = () => {
    return canAnyGroupPerformAction('data_source_delete');
  };

  useEffect(() => {
    useLicenseStore.getState().actions.fetchFeatureAccess();
  }, []);

  useEffect(() => {
    let licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
    setLicenseValid(licenseValid);
  }, [featureAccess]);

  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const super_admin = currentUserValue?.super_admin;
  const hasCommonPermissions =
    canReadDataSource() ||
    canUpdateDataSource() ||
    canCreateDataSource() ||
    canDeleteDataSource() ||
    admin ||
    super_admin;
  const isAuthorizedForGDS = hasCommonPermissions || admin || super_admin;

  const isBuilder = hasBuilderRole(authenticationService?.currentSessionValue?.role ?? {});

  const {
    checkForUnsavedChanges,
    handleDiscardChanges,
    handleSaveChanges,
    handleContinueEditing,
    unSavedModalVisible,
    nextRoute,
  } = useGlobalDatasourceUnsavedChanges();

  const canCreateVariableOrConstant = () => {
    return authenticationService.currentSessionValue.user_permissions?.org_constant_c_r_u_d;
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
                {logo ? <img src={logo} /> : <Logo />}
              </Link>
            </div>
            <LeftNavSideBar
              switchDarkMode={switchDarkMode}
              darkMode={darkMode}
              isAuthorizedForGDS={isAuthorizedForGDS}
              isBuilder={isBuilder}
              workflowsEnabled={false}
              canCreateVariableOrConstant={canCreateVariableOrConstant}
              featureAccess={featureAccess}
              checkForUnsavedChanges={checkForUnsavedChanges}
              router={router}
              admin={admin}
            />
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
