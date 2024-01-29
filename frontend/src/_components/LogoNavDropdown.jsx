import React from 'react';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { authenticationService } from '@/_services';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AppLogo from '@/_components/AppLogo';

export default function LogoNavDropdown({ darkMode, type = 'apps' }) {
  const getOverlay = () => {
    const isWorkflows = type === 'workflows';
    const { admin } = authenticationService?.currentSessionValue ?? {};
    return (
      <div className={`logo-nav-card settings-card card ${darkMode && 'dark-theme'}`}>
        <Link
          to={getPrivateRoute(isWorkflows ? 'workflows' : 'dashboard')}
          className="dropdown-item tj-text-xsm"
          data-cy="back-to-app-option"
        >
          <SolidIcon name="arrowbackdown" width="20" viewBox="0 0 20 20" />
          <span>Back to {isWorkflows ? 'workflows' : 'apps'}</span>
        </Link>
        <div className="divider"></div>
        <Link
          target="_blank"
          to={getPrivateRoute(!isWorkflows ? 'workflows' : 'dashboard')}
          className="dropdown-item tj-text-xsm"
        >
          <SolidIcon name={isWorkflows ? 'apps' : 'workflows'} width="20" fill="var(--slate8)" />
          <span>{isWorkflows ? 'Apps' : 'Workflows'}</span>
        </Link>

        {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
          <Link
            target="_blank"
            to={getPrivateRoute('database')}
            className="dropdown-item tj-text-xsm"
            data-cy="database-option"
          >
            <SolidIcon name="table" width="20" />
            <span>Database</span>
          </Link>
        )}
        <Link
          to={getPrivateRoute('data_sources')}
          className="dropdown-item tj-text-xsm"
          target="_blank"
          data-cy="data-source-option"
        >
          <SolidIcon name="datasource" width="20" />
          <span>Data sources</span>
        </Link>

        <Link
          to={getPrivateRoute('workspace_constants')}
          className="dropdown-item tj-text-xsm"
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
      style={{ transform: 'translate(5px, 52px)' }}
    >
      <div className="cursor-pointer">
        <AppLogo isLoadingFromHeader={false} />
      </div>
    </OverlayTrigger>
  );
}
