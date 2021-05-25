import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticationService } from '@/_services';

export const Header = function Header({

}) {

  const [pahtName, setPathName] = useState(document.location.pathname);

  useEffect(() => {
    setPathName(document.location.pathname);
  }, [document.location.pathname]);

  function logout() {
    authenticationService.logout();
    history.push('/login');
  }

  const { first_name, last_name } = authenticationService.currentUserValue;

  return <header className="navbar navbar-expand-md navbar-light d-print-none">
    <div className="container-xl">
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
        <span className="navbar-toggler-icon"></span>
      </button>
      <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
        <Link to={'/'}>
          <img src="/assets/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
        </Link>
      </h1>

      <ul class="navbar-nav">
        <li className={`nav-item mx-3 ${pahtName === '/' ? 'active' : ''}`}>
          <Link to={'/'} className="nav-link">
            <span className="nav-link-icon d-md-none d-lg-inline-block">
              <img src="https://www.svgrepo.com/show/309806/office-apps.svg" width="15" height="15" /> 
            </span>
            <span className="nav-link-title">
              Apps
            </span>
          </Link>
        </li>

        <li className={`nav-item ${pahtName === '/users' ? 'active' : ''}`}>
          <Link to={'/users'} className="nav-link">
            <span className="nav-link-icon d-md-none d-lg-inline-block">
              <img src="https://www.svgrepo.com/show/154834/users.svg" width="15" height="15" /> 
            </span>
            <span className="nav-link-title">
              Users
            </span>
          </Link>
        </li>
      </ul>
      <div className="navbar-nav flex-row order-md-last">
        <div className="nav-item dropdown">
          <a
            href="#"
            className="nav-link d-flex lh-1 text-reset p-0"
            data-bs-toggle="dropdown"
            aria-label="Open user menu"
          >
            <div className="d-none d-xl-block ps-2">
              <span class="avatar bg-azure-lt">
                {first_name ? first_name[0] : ''}
                {last_name ? last_name[0] : ''}
              </span>
            </div>
          </a>
          <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
            <a onClick={logout} className="dropdown-item">
              Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>
}