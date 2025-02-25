import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services';
import FolderList from '@/_ui/FolderList/FolderList';
import { redirectToErrorPage } from '@/_helpers/routes';
import { ERROR_TYPES } from '@/_helpers/constants';
import { BreadCrumbContext } from '@/App/App';
import { checkConditionsForRoute } from '@/_helpers/utils';
export default function WorkspaceSettingsPage({ extraLinks, ...props }) {
  const workspaceSettingsLinks = constructWorkspaceSettingsLinks(extraLinks);
  const admin = authenticationService.currentSessionValue?.admin;
  const [selectedTab, setSelectedTab] = useState(admin ? workspaceSettingsLinks[0].id : 'workspacevariables');
  const location = useLocation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const navigate = useNavigate();
  const [conditionObj, setConditionObj] = useState({
    admin: authenticationService.currentSessionValue?.admin,
    wsLoginEnabled: window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true',
  });

  //Filtered Links from the workspace settings links array
  const filteredLinks = () =>
    workspaceSettingsLinks.filter((item) => {
      return checkConditionsForRoute(item.conditions, conditionObj);
    });

  const getMenuFromRoute = (route) => {
    return workspaceSettingsLinks?.find((e) => e.route === route) || {};
  };

  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe((newOrd) => {
      setConditionObj({
        admin: newOrd?.admin,
        wsLoginEnabled: window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true',
      });
    });
    const selectedTabFromRoute = location.pathname.split('/').pop();
    if (selectedTabFromRoute === 'workspace-settings') {
      // No Sub routes added loading first one
      setSelectedTab(admin ? workspaceSettingsLinks[0].id : 'workspace-variables');
      navigate(admin ? workspaceSettingsLinks[0].route : 'workspace-variables');
    } else {
      const FieldDisabled = window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'false';
      if (FieldDisabled && selectedTabFromRoute === 'workspace-login') {
        redirectToErrorPage(ERROR_TYPES.WORKSPACE_LOGIN_RESTRICTED);
      }
      const selectedWorkspaceSetting = workspaceSettingsLinks?.find((m) => m.id === selectedTabFromRoute);
      updateSidebarNAV(selectedWorkspaceSetting?.name || '');
      setSelectedTab(getMenuFromRoute(selectedTabFromRoute)?.id);
    }

    return () => subscription.unsubscribe();
  }, [admin, location.pathname]);

  const handleClick = (data) => {
    setSelectedTab(data.id);
    updateSidebarNAV(data?.name || '');
  };

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper organization-settings-page">
        <div className="row gx-0">
          <div className="organization-page-sidebar col ">
            <div className="workspace-nav-list-wrap">
              {filteredLinks().map((item, index) => {
                const Wrapper = ({ children }) => <>{children}</>;
                return (
                  <Wrapper key={index}>
                    <Link
                      key={index}
                      to={item.route}
                      style={{
                        textDecoration: 'none',
                        border: 'none',
                        color: 'inherit',
                        outline: 'none',
                        backgroundColor: 'inherit',
                      }}
                    >
                      <FolderList
                        className="workspace-settings-nav-items"
                        key={index}
                        onClick={() => {
                          handleClick(item);
                        }}
                        selectedItem={selectedTab == item.id}
                        renderBadgeForItems={[]}
                        renderBadge={() => (
                          <span
                            style={{ width: '40px', textTransform: 'lowercase' }}
                            className="badge bg-color-primary badge-pill"
                          >
                            new
                          </span>
                        )}
                        dataCy={item.name.toLowerCase().replace(/\s+/g, '-')}
                      >
                        {item.name}
                      </FolderList>
                    </Link>
                  </Wrapper>
                );
              })}
            </div>
          </div>

          <div className={cx('col workspace-content-wrapper')} style={{ paddingTop: '40px' }}>
            <div className="w-100">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* Removed workspace variables */
function constructWorkspaceSettingsLinks(extraLinks) {
  const commonLinks = [
    { id: 'users', name: 'Users', route: 'users', conditions: ['admin'] },
    { id: 'groups', name: 'Groups', route: 'groups', conditions: ['admin'] },
    {
      id: 'workspacelogin',
      name: 'Workspace login',
      route: 'workspace-login',
      conditions: ['admin', 'wsLoginEnabled'],
    },
    ...(extraLinks ? extraLinks : []),
  ];
  return commonLinks;
}
