import React, { useState, useEffect } from 'react';
import config from 'config';
import { Link } from 'react-router-dom';
import { authenticationService, userService } from '@/_services';
import { history } from '@/_helpers';
import { DarkModeToggle } from './DarkModeToggle';
import LogoIcon from '../Editor/Icons/logo.svg';
import { Organization } from './Organization';
import { NotificationCenter } from './NotificationCenter';
import { useTranslation } from 'react-i18next';

export const Header = function Header({ switchDarkMode, darkMode }) {
  // eslint-disable-next-line no-unused-vars
  const [pathName, setPathName] = useState(document.location.pathname);
  const [avatar, setAvatar] = useState();
  const { first_name, last_name, avatar_id, admin } = authenticationService.currentUserValue;
  const currentVersion = localStorage.getItem('currentVersion');
  const { t } = useTranslation();

  useEffect(() => {
    setPathName(document.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.location.pathname]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function fetchAvatar() {
      const blob = await userService.getAvatar(avatar_id);
      setAvatar(URL.createObjectURL(blob));
    }
    if (avatar_id) fetchAvatar();

    () => avatar && URL.revokeObjectURL(avatar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar_id]);

  function logout() {
    authenticationService.logout();
    history.push('/login');
  }

  return (
    <header className="navbar tabbed-navbar navbar-expand-md navbar-light d-print-none">
      <div className="container-xl">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
          {/* <span className="navbar-toggler-icon"></span> */}
        </button>
        <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0">
          <Link to={'/'} data-cy="home-page-logo">
            <LogoIcon />
          </Link>
        </h1>

        <div className="navbar-nav flex-row order-md-last">
          <div className="p-1 m-1 d-flex align-items-center" data-cy="mode-toggle">
            <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} />
          </div>

          {config.COMMENT_FEATURE_ENABLE && (
            <div className="p-1 d-flex align-items-center" data-cy="notification-center">
              <NotificationCenter />
            </div>
          )}
          <div>
            <Organization admin={admin} darkMode={darkMode} />
          </div>
          <div className="nav-item dropdown ms-2 user-avatar-nav-item">
            <a
              href="#"
              className="nav-link d-flex lh-1 text-reset p-0"
              data-bs-toggle="dropdown"
              aria-label="Open user menu"
              data-testid="userAvatarHeader"
            >
              <div className="d-xl-block" data-cy="user-menu">
                {avatar_id ? (
                  <span
                    className="avatar avatar-sm"
                    style={{
                      backgroundImage: `url(${avatar})`,
                    }}
                    data-cy="user-avatar"
                  />
                ) : (
                  <span className={`avatar bg-secondary-lt ${darkMode && 'text-muted'}`}>
                    {first_name ? first_name[0] : ''}
                    {last_name ? last_name[0] : ''}
                  </span>
                )}
              </div>
            </a>
            <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow end-0" data-cy="dropdown-menu">
              <Link data-testid="settingsBtn" to="/settings" className="dropdown-item" data-cy="profile-link">
                {t('header.profile', 'Profile')}
              </Link>
              <Link data-testid="logoutBtn" to="#" onClick={logout} className="dropdown-item" data-cy="logout-link">
                {t('header.logout', 'Logout')}
              </Link>
              {currentVersion && (
                <Link to="#" className={`dropdown-item pe-none ${darkMode ? 'color-muted-darkmode' : 'color-muted'}`}>
                  v{currentVersion}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
