import React from 'react';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AppLogo from './AppLogo';

export default function LogoNavDropdown({ darkMode }) {
  const getOverlay = () => {
    return (
      <div className={`logo-nav-card settings-card card ${darkMode && 'dark-theme'}`}>
        <Link
          onClick={(event) => getPrivateRoute('dashboard')}
          to={getPrivateRoute('dashboard')}
          className="dropdown-item tj-text-xsm"
        >
          <SolidIcon name="arrowbackdown" width="20" viewBox="0 0 20 20" />
          <span>Back to apps</span>
        </Link>
        <div className="divider"></div>

        <Link
          onClick={(event) => getPrivateRoute('database')}
          to={getPrivateRoute('database')}
          className="dropdown-item tj-text-xsm"
        >
          <SolidIcon name="table" width="20" />
          <span>Database</span>
        </Link>
        <Link
          onClick={(event) => getPrivateRoute('data_sources')}
          to={getPrivateRoute('data_sources')}
          className="dropdown-item tj-text-xsm"
        >
          <SolidIcon name="datasource" width="20" />
          <span>Data sources</span>
        </Link>

        <Link
          onClick={(event) => getPrivateRoute('workspace_constants')}
          to={getPrivateRoute('workspace_constants')}
          className="dropdown-item tj-text-xsm"
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
        <AppLogo isLoadingFromHeader={true} />
      </div>
    </OverlayTrigger>
  );
}
