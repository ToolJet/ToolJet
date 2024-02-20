import React from 'react';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { authenticationService } from '@/_services';
import { getPrivateRoute, redirectToDashboard } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AppLogo from './AppLogo';
import { useEditorActions } from '@/_stores/editorStore';

export default function LogoNavDropdown({ darkMode }) {
  const { updateEditorState } = useEditorActions();
  const handleBackClick = (e) => {
    e.preventDefault();
    updateEditorState({ isLoading: true });
    // Force a reload for clearing interval triggers
    redirectToDashboard();
  };

  const getOverlay = () => {
    const { admin } = authenticationService?.currentSessionValue ?? {};
    return (
      <div className={`logo-nav-card settings-card card ${darkMode && 'dark-theme'}`}>
        <Link className="dropdown-item tj-text tj-text-xsm" data-cy="back-to-app-option" onClick={handleBackClick}>
          <SolidIcon name="arrowbackdown" width="20" viewBox="0 0 20 20" fill="#C1C8CD" />
          <span>Back to apps</span>
        </Link>
        <div className="divider"></div>
        {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
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
        <Link
          to={getPrivateRoute('data_sources')}
          className="dropdown-item tj-text tj-text-xsm"
          target="_blank"
          data-cy="data-source-option"
        >
          <SolidIcon name="datasource" width="20" />
          <span>Data sources</span>
        </Link>

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
        <AppLogo isLoadingFromHeader={true} />
      </div>
    </OverlayTrigger>
  );
}
