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
import config from 'config';
import { getPrivateRoute } from '@/_helpers/routes';

function Layout({ children, switchDarkMode, darkMode }) {
  const router = useRouter();
  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const marketplaceEnabled = config.ENABLE_MARKETPLACE_FEATURE === 'true';

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
                {marketplaceEnabled && (
                  <li className="text-center mt-3 d-flex flex-column">
                    <Link to="/integrations">
                      <ToolTip message="Marketplace (Beta)" placement="right">
                        <SolidIcon
                          name="marketplace"
                          fill={router.pathname === '/integrations' ? '#3E63DD' : darkMode ? '#4C5155' : '#C1C8CD'}
                        />
                        {/* <div
                        className="layout-sidebar-icon cursor-pointer"
                        style={{
                          width: '32px',
                          height: '33px',
                          padding: '4px 6px',
                          backgroundColor: router.pathname === '/integrations' ? '#E6EDFE' : '#none',
                          borderRadius: '4px',
                          marginLeft: '2px',
                        }}
                      >
                        <svg
                          width="auto"
                          height="auto"
                          viewBox="0 0 32 33"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            y="0.325684"
                            width="32"
                            height="33"
                            rx="4"
                            fill={router.pathname === '/integrations' ? '#E6EDFE' : '#none'}
                          />
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M1.62969 5.61618C2.77971 2.2981 5.61934 0 8.90009 0H23.1C26.3808 0 29.2204 2.2981 30.3703 5.61618L31.4989 8.87221C31.8601 9.91437 32.199 11.2583 31.8603 12.6375C31.4447 14.33 30.4545 15.8106 29.1062 16.732V25.6641C29.1062 29.7155 25.9046 33 21.955 33H10.0443C6.0949 33 2.89327 29.7155 2.89327 25.6641V16.7315C1.54526 15.8101 0.555389 14.3297 0.139727 12.6375C-0.199061 11.2583 0.13995 9.91437 0.501169 8.87219L1.62969 5.61618ZM5.2846 17.6707V25.6641C5.2846 28.3608 7.4156 30.5468 10.0443 30.5468H21.955C24.5839 30.5468 26.7149 28.3608 26.7149 25.6641V17.6709C26.4575 17.7075 26.1941 17.7266 25.9256 17.7266C23.8362 17.7266 22.0625 16.5866 20.9628 14.8887C19.8633 16.5866 18.0895 17.7266 16 17.7266C13.9106 17.7266 12.1368 16.5866 11.0372 14.8887C9.93758 16.5866 8.16383 17.7266 6.07436 17.7266C5.80578 17.7266 5.54226 17.7075 5.2846 17.6707ZM12.2329 10.7725C12.2329 13.3981 14.048 15.2735 16 15.2735C17.9521 15.2735 19.7671 13.3981 19.7671 10.7725C19.7671 10.095 20.3025 9.54589 20.9628 9.54589C21.6231 9.54589 22.1585 10.095 22.1585 10.7725C22.1585 13.3981 23.9737 15.2735 25.9256 15.2735C27.5508 15.2735 29.0597 13.9991 29.5415 12.0381C29.7011 11.3886 29.5678 10.6231 29.2457 9.69403L28.1172 6.438C27.2574 3.9574 25.2307 2.45316 23.1 2.45316H8.90009C6.7693 2.45316 4.7426 3.9574 3.88283 6.438L2.75431 9.69403C2.4323 10.6231 2.29904 11.3886 2.45859 12.0381C2.94028 13.9991 4.44929 15.2735 6.07436 15.2735C8.02641 15.2735 9.84152 13.3981 9.84152 10.7725C9.84152 10.095 10.3768 9.54589 11.0372 9.54589C11.6975 9.54589 12.2329 10.095 12.2329 10.7725ZM21.5079 23.5342C21.8321 24.1245 21.6287 24.8725 21.0535 25.2052C19.2402 26.254 17.6675 26.8874 16.0041 26.8907C14.3385 26.8939 12.7627 26.2654 10.942 25.2029C10.368 24.8679 10.1674 24.1191 10.4939 23.5302C10.8204 22.9414 11.5504 22.7357 12.1244 23.0706C13.8116 24.0551 14.9511 24.4395 15.9995 24.4375C17.0499 24.4354 18.19 24.0452 19.879 23.0683C20.4542 22.7355 21.1834 22.9442 21.5079 23.5342Z"
                            fill={router.pathname === '/integrations' ? '#3E63DD' : '#C1C8CD'}
                          />
                        </svg>
                      </div> */}
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
      <div style={{ paddingLeft: 56, paddingRight: 0 }} className="col">
        <Header />
        <div style={{ paddingTop: 64 }}>{children}</div>
      </div>
    </div>
  );
}

export default Layout;
