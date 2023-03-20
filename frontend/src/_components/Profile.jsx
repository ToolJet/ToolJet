import React from 'react';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { history } from '@/_helpers';
import Avatar from '@/_ui/Avatar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useTranslation } from 'react-i18next';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '../_ui/Icon/SolidIcons';

export const Profile = function Header({ darkMode }) {
  const { first_name, last_name, avatar_id } = authenticationService.currentUserValue;
  const { t } = useTranslation();

  function logout() {
    authenticationService.logout();
    history.push('/login');
  }

  const getOverlay = () => {
    return (
      <div className={`profile-card card ${darkMode && 'dark-theme'}`}>
        <Link data-testid="settingsBtn" to="/settings" className="dropdown-item tj-text-xsm" data-cy="profile-link">
          <SolidIcon name="user" />

          {t('header.profile', 'Profile')}
        </Link>

        <Link
          data-testid="logoutBtn"
          to="#"
          onClick={logout}
          className="dropdown-item text-danger tj-text-xsm"
          data-cy="logout-link"
        >
          <SolidIcon name="logout" />

          {t('header.logout', 'Logout')}
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger trigger="click" placement={'right'} rootClose={true} overlay={getOverlay()}>
      <div className="user-avatar-nav-item cursor-pointer">
        <ToolTip message="Profile">
          <div className="d-xl-block" data-cy="profile-settings">
            <Avatar
              className="tj-avatar"
              avatarId={avatar_id}
              text={`${first_name ? first_name[0] : ''}${last_name ? last_name[0] : ''}`}
            />
          </div>
        </ToolTip>
      </div>
    </OverlayTrigger>
  );
};
