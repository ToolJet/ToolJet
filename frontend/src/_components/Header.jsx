import React from 'react';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';
import { history } from '@/_helpers';
import { DarkModeToggle } from './DarkModeToggle';

export const Header = function Header({ switchDarkMode, darkMode }) {
  function logout() {
    authenticationService.logout();
    history.push('/login');
  }

  function openSettings() {
    history.push('/settings');
  }

  const { first_name, last_name, admin } = authenticationService.currentUserValue;

  return (
    <header className="navbar navbar-expand-md navbar-light d-print-none">
      <div className="container-xl">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
          {/* <span className="navbar-toggler-icon"></span> */}
        </button>
        <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
          <Link to={'/'}>
            <img src="/assets/images/logo-text.svg" width="110" height="32" className="navbar-brand-image" />
          </Link>
        </h1>

        <div className="navbar-nav flex-row order-md-last">
          <div className="p-1 m-1 d-flex align-items-center">
            <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} />
          </div>
          <div className="nav-item dropdown">
            <a
              href="#"
              className="nav-link d-flex lh-1 text-reset p-0"
              data-bs-toggle="dropdown"
              aria-label="Open user menu"
              data-testid="userAvatarHeader"
            >
              <div className="d-none d-xl-block ps-2">
                <span className="avatar bg-azure-lt">
                  {first_name ? first_name[0] : ''}
                  {last_name ? last_name[0] : ''}
                </span>
              </div>
            </a>
            <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
              {admin && (
                <Link data-testid="settingsBtn" to="/users" className="dropdown-item">
                  Manage Users
                </Link>
              )}
              {admin && (
                <Link data-tesid="settingsBtn" to="/groups" className="dropdown-item">
                  Manage Groups
                </Link>
              )}
              <Link data-testid="settingsBtn" to="#" onClick={openSettings} className="dropdown-item">
                Profile
              </Link>
              <Link data-testid="logoutBtn" to="#" onClick={logout} className="dropdown-item">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
