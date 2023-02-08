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
            <div className="application-brand  tj-leftsidebar-icon-items" data-cy={`home-page-logo`}>
              <Link to="/">
                <Logo />
              </Link>
            </div>
            <div>
              <ul className="sidebar-inner nav nav-vertical">
                <li className="text-center cursor-pointer">
                  <Link to="/" className=" tj-leftsidebar-icon-items">
                    <ToolTip message="Dashboard" placement="right">
                      <SolidIcon name="apps" fill={router.pathname === '/' ? '#3E63DD' : '#C1C8CD'} />
                    </ToolTip>
                  </Link>
                </li>
                {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
                  <li className="text-center  cursor-pointer">
                    <Link to="/database" className=" tj-leftsidebar-icon-items">
                      <ToolTip message="Tables" placement="right">
                        <SolidIcon name="table" fill={router.pathname === '/database' ? '#3E63DD' : '#C1C8CD'} />
                      </ToolTip>
                    </Link>
                  </li>
                )}
                <li className="text-center  cursor-pointer ">
                  <Link to="/workspace-settings" className=" tj-leftsidebar-icon-items">
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
                  <Link to="/workspace-settings" className=" tj-leftsidebar-icon-items">
                    <ToolTip message="Datasource" placement="right">
                      <SolidIcon name="datasource" fill={router.pathname === '/datasources' ? '#3E63DD' : '#C1C8CD'} />
                    </ToolTip>
                  </Link>
                </li>
                {/* INSTANCE SETTINGS */}
                <li className="text-center  cursor-pointer ">
                  <Link to="/workspace-settings" className=" tj-leftsidebar-icon-items">
                    <ToolTip message="Instance settings" placement="right">
                      <SolidIcon
                        name="server"
                        fill={router.pathname === '/instance-settings' ? '#3E63DD' : '#C1C8CD'}
                      />
                    </ToolTip>
                  </Link>
                </li>
                <li className="tj-leftsidebar-icon-items-bottom text-center">
                  <NotificationCenter darkMode={darkMode} className="tj-leftsidebar-icon-items" />
                  <SolidIcon
                    name="darkmode"
                    // fill={router.pathname === '/darkmode' ? '#3E63DD' : '#C1C8CD'}
                    onClick={() => switchDarkMode(!darkMode)}
                    className="cursor-pointer  tj-leftsidebar-icon-items"
                  />
                  <Profile switchDarkMode={switchDarkMode} darkMode={darkMode} />
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <div style={{ paddingLeft: 56 }} className="col">
        <Header />
        <div style={{ paddingTop: 63 }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
