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

  return <header className="navbar navbar-expand-md navbar-light d-print-none">
    <div className="container-xl">
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
        <span className="navbar-toggler-icon"></span>
      </button>
      <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
        <Link to={'/'} className="nav-link active">
          <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
        </Link>
      </h1>
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to={'/'} className={`nav-link ${pahtName === '/' ? 'active' : ''}`}>
            <span className="nav-link-title">
              <img src="https://www.svgrepo.com/show/309806/office-apps.svg" className="mx-2" width="12" height="12" /> Apps
            </span>
          </Link>
        </li>
        <li className="nav-item">
          <Link to={'/users'} className={`nav-link ${pahtName === '/users' ? 'active' : ''}`}>
            <span className="nav-link-title">
              <img src="https://www.svgrepo.com/show/154834/users.svg" className="mx-2" width="12" height="12" />Users
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
              <div>{authenticationService.currentUserValue.first_name}</div>
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