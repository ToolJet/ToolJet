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
                  <Link
                    to="/"
                    className={`tj-leftsidebar-icon-items ${router.pathname === '/' && `current-seleted-route`}`}
                  >
                    <ToolTip message="Dashboard" placement="right">
                      <SolidIcon name="apps" fill={router.pathname === '/' ? '#3E63DD' : '#C1C8CD'} />
                    </ToolTip>
                  </Link>
                </li>
                {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
                  <li className="text-center  cursor-pointer">
                    <Link
                      to="/database"
                      className={`tj-leftsidebar-icon-items  ${
                        router.pathname === '/database' && `current-seleted-route`
                      }`}
                    >
                      <ToolTip message="Tables" placement="right">
                        <SolidIcon name="table" fill={router.pathname === '/database' ? '#3E63DD' : '#C1C8CD'} />
                      </ToolTip>
                    </Link>
                  </li>
                )}
                <li className="text-center cursor-pointer">
                  <Link
                    to="/workspace-settings"
                    className={`tj-leftsidebar-icon-items  ${
                      router.pathname === '/workspace-settings' && `current-seleted-route`
                    }`}
                  >
                    <ToolTip message="Workspace settings" placement="right">
                      <SolidIcon
                        name="setting"
                        fill={router.pathname === '/workspace-settings' ? '#3E63DD' : '#C1C8CD'}
                      />
                    </ToolTip>
                  </Link>
                </li>
                {/* DATASOURCES */}
                <li className="text-center  cursor-pointer">
                  <Link
                    to="/datasources"
                    className={`tj-leftsidebar-icon-items  ${
                      router.pathname === '/datasources' && `current-seleted-route`
                    }`}
                  >
                    <ToolTip message="Datasource" placement="right">
                      <SolidIcon name="datasource" fill={router.pathname === '/datasources' ? '#3E63DD' : '#C1C8CD'} />
                    </ToolTip>
                  </Link>
                </li>
                {/* INSTANCE SETTINGS */}
                <li className="text-center  cursor-pointer ">
                  <Link
                    to="/instance-settings"
                    className={`tj-leftsidebar-icon-items  ${
                      router.pathname === '/instance-settings' && `current-seleted-route`
                    }`}
                  >
                    <ToolTip message="Instance settings" placement="right">
                      <SolidIcon
                        name="server"
                        fill={router.pathname === '/instance-settings' ? '#3E63DD' : '#C1C8CD'}
                      />
                    </ToolTip>
                  </Link>
                </li>
                <li className="tj-leftsidebar-icon-items-bottom text-center">
                  <NotificationCenter darkMode={darkMode} />
                  <div className="cursor-pointer  tj-leftsidebar-icon-items" onClick={() => switchDarkMode(!darkMode)}>
                    <SolidIcon name={darkMode ? 'lightmode' : 'darkmode'} fill={'#C1C8CD'} />
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
