import React from 'react';
import { Link } from 'react-router-dom';
import useRouter from '@/_hooks/use-router';
import { ToolTip } from '@/_components/ToolTip';
import { Profile } from '@/_components/Profile';
import { NotificationCenter } from '@/_components/NotificationCenter';
import Logo from '@assets/images/rocket.svg';
import Header from '../Header';
import { authenticationService } from '@/_services';
import SolidIcon from '../Icon/SolidIcons';

function Layout({ children, switchDarkMode, darkMode }) {
  const router = useRouter();
  const { admin } = authenticationService.currentUserValue;

  return (
    <div className="row m-auto">
      <div className="col-auto p-0">
        <aside className="left-sidebar h-100 position-fixed">
          <div className="tj-leftsidebar-icon-wrap">
            <div className="application-brand" data-cy={`home-page-logo`}>
              <Link to="/">
                <Logo />
              </Link>
            </div>
            <div>
              <ul className="sidebar-inner nav nav-vertical">
                <li className="text-center cursor-pointer">
                  <ToolTip message="Dashboard" placement="right">
                    <Link
                      to="/"
                      className={`tj-leftsidebar-icon-items ${router.pathname === '/' && `current-seleted-route`}`}
                    >
                      <SolidIcon
                        name="apps"
                        fill={router.pathname === '/' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                      />
                    </Link>
                  </ToolTip>
                </li>
                {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
                  <li className="text-center  cursor-pointer">
                    <ToolTip message="Tables" placement="right">
                      <Link
                        to="/database"
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === '/database' && `current-seleted-route`
                        }`}
                      >
                        <SolidIcon
                          name="table"
                          fill={router.pathname === '/database' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}
                <li className="text-center cursor-pointer">
                  <ToolTip message="Workspace settings" placement="right">
                    <Link
                      to="/workspace-settings"
                      className={`tj-leftsidebar-icon-items  ${
                        router.pathname === '/workspace-settings' && `current-seleted-route`
                      }`}
                    >
                      <SolidIcon
                        name="setting"
                        fill={router.pathname === '/workspace-settings' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                      />
                    </Link>
                  </ToolTip>
                </li>
                {/* DATASOURCES */}

                {admin && (
                  <li className="text-centercursor-pointer">
                    <Link
                      to="/global-datasources"
                      className={`tj-leftsidebar-icon-items  ${
                        router.pathname === '/global-datasources' && `current-seleted-route`
                      }`}
                    >
                      <ToolTip message="Global Datasources" placement="right">
                        <SolidIcon
                          name="datasource"
                          fill={
                            router.pathname === '/global-datasources' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'
                          }
                        />
                      </ToolTip>
                    </Link>
                  </li>
                )}
                <li className="tj-leftsidebar-icon-items-bottom text-center">
                  <NotificationCenter darkMode={darkMode} />
                  <div className="cursor-pointer  tj-leftsidebar-icon-items" onClick={() => switchDarkMode(!darkMode)}>
                    <SolidIcon name={darkMode ? 'lightmode' : 'darkmode'} fill={darkMode ? '#4C5155' : '#C1C8CD'} />
                  </div>
                  <Profile switchDarkMode={switchDarkMode} darkMode={darkMode} />
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <div style={{ paddingLeft: 56 }} className="col">
        <Header />
        <div style={{ paddingTop: 64 }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
