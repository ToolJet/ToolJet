import React from 'react';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { authenticationService } from '@/_services';
import { getPrivateRoute, redirectToDashboard, redirectToWorkflows } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AppLogo from '@/_components/AppLogo';
import { hasBuilderRole } from '@/_helpers/utils';

const BaseLogoNavDropdown = ({ darkMode, showWorkflows = false, type = 'apps' }) => {
  const { admin } = authenticationService?.currentSessionValue ?? {};
  const isWorkflows = type === 'workflows';
  const workflowsEnabled = admin && window.public_config?.ENABLE_WORKFLOWS_FEATURE == 'true';

  const handleBackClick = (e) => {
    e.preventDefault();
    // Force a reload for clearing interval triggers
    isWorkflows ? redirectToWorkflows() : redirectToDashboard();
  };

  const backToLinkProps = { to: getPrivateRoute(isWorkflows ? 'workflows' : 'dashboard') };

  const getOverlay = () => {
    const { admin } = authenticationService?.currentSessionValue ?? {};
    const data_source_group_permissions = authenticationService?.currentSessionValue?.data_source_group_permissions;
    const showDataSource =
      authenticationService?.currentSessionValue?.user_permissions?.data_source_create === true ||
      authenticationService?.currentSessionValue?.user_permissions?.data_source_delete === true ||
      data_source_group_permissions?.usable_data_sources_id?.length ||
      data_source_group_permissions?.is_all_usable ||
      data_source_group_permissions?.configurable_data_source_id?.length ||
      data_source_group_permissions?.is_all_configurable;
    const isBuilder = hasBuilderRole(authenticationService?.currentSessionValue?.role ?? {});

    return (
      <div className={`logo-nav-card settings-card card ${darkMode && 'dark-theme'}`}>
        <Link
          className="dropdown-item tj-text tj-text-xsm"
          data-cy="back-to-app-option"
          onClick={handleBackClick}
          {...backToLinkProps}
        >
          <SolidIcon name="arrowbackdown" width="20" viewBox="0 0 20 20" fill="#C1C8CD" />
          <span>Back to {isWorkflows ? 'workflows' : 'apps'}</span>
        </Link>
        <div className="divider"></div>
        {isWorkflows || !showWorkflows
          ? null
          : workflowsEnabled &&
            showWorkflows &&
            admin && (
              <Link target="_blank" to={getPrivateRoute('workflows')} className="dropdown-item tj-text tj-text-xsm">
                <SolidIcon name={'workflows'} width="20" fill="#C1C8CD" />
                <span>{'Workflows'}</span>
              </Link>
            )}
        {(admin || isBuilder) && (
          <Link
            target="_blank"
            to={getPrivateRoute('database')}
            className="dropdown-item tj-text tj-text-xsm"
            data-cy="database-option"
          >
            <SolidIcon name="table" width="20" />
            <span>Database</span>
          </Link>
        )}
        {(admin || showDataSource) && (
          <Link
            to={getPrivateRoute('data_sources')}
            className="dropdown-item tj-text tj-text-xsm"
            target="_blank"
            data-cy="data-source-option"
          >
            <SolidIcon name="datasource" width="20" />
            <span>Data sources</span>
          </Link>
        )}
        <Link
          to={getPrivateRoute('workspace_constants')}
          className="dropdown-item tj-text tj-text-xsm"
          target="_blank"
          data-cy="workspace-constants-option"
        >
          <SolidIcon name="workspaceconstants" width="20" viewBox="0 0 20 20" />
          <span>Workspace constants</span>
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger
      trigger="click"
      placement={'bottom'}
      rootClose={true}
      overlay={getOverlay()}
      style={{ transform: 'translate(5px, 52px)', zIndex: '100' }}
    >
      <div className="cursor-pointer">
        <AppLogo isLoadingFromHeader={false} />
      </div>
    </OverlayTrigger>
  );
};

export default BaseLogoNavDropdown;
