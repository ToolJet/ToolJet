import React, { useState } from 'react';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useTranslation } from 'react-i18next';
import { ToolTip } from '@/_components/ToolTip';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export default function Settings({ darkMode, checkForUnsavedChanges }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';

  const { t } = useTranslation();

  function logout() {
    authenticationService.logout();
  }
  const handleOverlayToggle = (value) => {
    setShowOverlay(value);
  };

  const getOverlay = () => {
    return (
      <div className={`settings-card tj-text card ${darkMode && 'dark-theme'}`}>
        {marketplaceEnabled && (
          <>
            <Link
              onClick={(event) => checkForUnsavedChanges('/integrations', event)}
              to={'/integrations'}
              className="dropdown-item tj-text-xsm"
              data-cy="marketplace-option"
            >
              <span>Marketplace</span>
            </Link>
            <div className="divider"></div>
          </>
        )}
        {admin && (
          <Link
            onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workspace_settings'), event)}
            to={getPrivateRoute('workspace_settings')}
            className="dropdown-item tj-text-xsm"
            data-cy="workspace-settings"
          >
            <span>Workspace settings</span>
          </Link>
        )}

        <Link
          onClick={(event) => checkForUnsavedChanges(getPrivateRoute('settings'), event)}
          to={getPrivateRoute('settings')}
          className="dropdown-item tj-text-xsm"
          data-cy="profile-settings"
        >
          <span>Profile settings</span>
        </Link>
        <div className="divider"></div>
        <Link
          data-testid="logoutBtn"
          to="#"
          onClick={logout}
          className="dropdown-item text-danger tj-text-xsm"
          data-cy="logout-link"
        >
          <span>{t('header.logout', 'Logout')}</span>
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger
      onToggle={handleOverlayToggle}
      rootClose={true}
      trigger="click"
      placement={'top'}
      overlay={getOverlay()}
    >
      <div className={cx('settings-nav-item cursor-pointer', { active: showOverlay })} data-cy="settings-icon">
        <div className="d-xl-block">
          <SolidIcon name="settings" fill={showOverlay ? '#3E63DD' : 'var(--slate8)'} width={28} />
        </div>
      </div>
    </OverlayTrigger>
  );
}
