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
import { getPrivateRoute } from '@/_helpers/routes';

function Layout({ children, switchDarkMode, darkMode }) {
  const router = useRouter();
  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const marketplaceEnabled = admin && window.public_config?.ENABLE_MARKETPLACE_FEATURE == 'true';

  return (
    <div className="row m-auto">
      <div className="col-auto p-0">
        <aside className="left-sidebar h-100 position-fixed">
          <div className="tj-leftsidebar-icon-wrap">
            <div className="application-brand" data-cy={`home-page-logo`}>
              <Link to={getPrivateRoute('dashboard')}>
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
                        fill={
                          router.pathname === '/:workspaceId' || router.pathname === getPrivateRoute('dashboard')
                            ? '#3E63DD'
                            : darkMode
                            ? '#4C5155'
                            : '#C1C8CD'
                        }
                      />
                    </Link>
                  </ToolTip>
                </li>
                {window.public_config?.ENABLE_TOOLJET_DB == 'true' && admin && (
                  <li className="text-center  cursor-pointer">
                    <ToolTip message="Tables" placement="right">
                      <Link
                        to={getPrivateRoute('database')}
                        className={`tj-leftsidebar-icon-items  ${
                          router.pathname === getPrivateRoute('database') &&
                          `current-seleted-route` &&
                          `current-seleted-route`
                        }`}
                      >
                        <SolidIcon
                          name="table"
                          fill={
                            router.pathname === getPrivateRoute('database') && `current-seleted-route`
                              ? '#3E63DD'
                              : darkMode
                              ? '#4C5155'
                              : '#C1C8CD'
                          }
                        />
                      </Link>
                    </ToolTip>
                  </li>
                )}

                {/* DATASOURCES */}
                {admin && (
                  <li className="text-center cursor-pointer">
                    <Link
                      to={getPrivateRoute('global_datasources')}
                      className={`tj-leftsidebar-icon-items  ${
                        router.pathname === '/global_datasources' && `current-seleted-route`
                      }`}
                    >
                      <ToolTip message="Global Datasources" placement="right">
                        <SolidIcon
                          name="datasource"
                          fill={
                            router.pathname === getPrivateRoute('global_datasources')
                              ? '#3E63DD'
                              : darkMode
                              ? '#4C5155'
                              : '#C1C8CD'
                          }
                        />
                      </ToolTip>
                    </Link>
                  </li>
                )}
                {marketplaceEnabled && (
                  <li className="text-center d-flex flex-column">
                    <Link
                      to="/integrations"
                      className={`tj-leftsidebar-icon-items  ${
                        router.pathname === '/integrations' && `current-seleted-route`
                      }`}
                    >
                      <ToolTip message="Marketplace (Beta)" placement="right">
                        <SolidIcon
                          name="marketplace"
                          fill={router.pathname === '/integrations' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                        />
                      </ToolTip>
                    </Link>
                  </li>
                )}
                <li className="text-center cursor-pointer">
                  <Link
                    to={getPrivateRoute('workspace_settings')}
                    className={`tj-leftsidebar-icon-items  ${
                      router.pathname === '/workspace-settings' && `current-seleted-route`
                    }`}
                  >
                    <ToolTip message="Workspace settings" placement="right">
                      <SolidIcon
                        name="setting"
                        fill={
                          router.pathname === getPrivateRoute('workspace_settings')
                            ? '#3E63DD'
                            : darkMode
                            ? '#4C5155'
                            : '#C1C8CD'
                        }
                      />
                    </ToolTip>
                  </Link>
                </li>
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
      <div style={{ paddingLeft: 56, paddingRight: 0 }} className="col">
        <Header />
        <div style={{ paddingTop: 64 }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
