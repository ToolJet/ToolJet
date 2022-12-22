import React from 'react';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { history } from '@/_helpers';
import Avatar from '@/_ui/Avatar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { DarkModeToggle } from './DarkModeToggle';
import { useTranslation } from 'react-i18next';
import { ToolTip } from '@/_components/ToolTip';

export const Profile = function Header({ switchDarkMode, darkMode }) {
  const { first_name, last_name, avatar_id } = authenticationService.currentUserValue;
  const { t } = useTranslation();

  function logout() {
    authenticationService.logout();
    history.push('/login');
  }

  const getOverlay = () => {
    return (
      <div className="card">
        <Link data-testid="settingsBtn" to="/settings" className="dropdown-item" data-cy="profile-link">
          {t('header.profile', 'Profile')}
        </Link>
        <div className="dropdown-item" onClick={() => switchDarkMode(!darkMode)}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </div>
        <Link data-testid="logoutBtn" to="#" onClick={logout} className="dropdown-item" data-cy="logout-link">
          {t('header.logout', 'Logout')}
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger trigger="click" placement={'right'} rootClose={true} overlay={getOverlay()}>
      <div className="user-avatar-nav-item">
        <ToolTip message="Profile">
          <div className="d-xl-block" data-cy="user-menu">
            <Avatar avatarId={avatar_id} text={`${first_name ? first_name[0] : ''}${last_name ? last_name[0] : ''}`} />
          </div>
        </ToolTip>
      </div>
    </OverlayTrigger>
  );
};
