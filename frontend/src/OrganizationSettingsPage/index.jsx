import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { useParams, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services';
import { BreadCrumbContext } from '../App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { OrganizationList } from '../_components/OrganizationManager/List';
import { getWorkspaceId } from '@/_helpers/utils';

export function OrganizationSettings(props) {
  const [admin, setAdmin] = useState(authenticationService.currentSessionValue?.admin);
  const [selectedTab, setSelectedTab] = useState(admin ? 'Users & permissions' : 'manageEnvVars');
  const navigate = useNavigate();
  const location = useLocation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const { workspaceId } = useParams();

  const sideBarNavs = ['Users', 'Groups', 'Workspace login', 'Workspace variables'];
  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'users':
        return 'Users';
      case 'groups':
        return 'Groups';
      case 'workspace-login':
        return 'Workspace login';
      case 'workspace-variables':
        return 'Workspace variables';
      default:
        return groupName;
    }
  };

  if (!admin) {
    navigate('/');
  }

  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe((newOrd) => {
      setAdmin(newOrd?.admin);
    });
    admin ? updateSidebarNAV('Users') : updateSidebarNAV('Workspace variables');

    () => subscription.unsubsciption();
    const selectedTabFromRoute = location.pathname.split('/').pop();
    if (selectedTabFromRoute === 'workspace-settings') {
      setSelectedTab(admin ? 'Users' : 'Workspace variables');
      window.location.href = admin
        ? `/${workspaceId}/workspace-settings/users`
        : `/${workspaceId}/workspace-settings/workspace-variables`;
    } else {
      setSelectedTab(defaultOrgName(selectedTabFromRoute));
    }
    updateSidebarNAV(defaultOrgName(selectedTabFromRoute));
  }, [navigate, workspaceId, authenticationService.currentSessionValue?.admin]);

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper organization-settings-page">
        <div className="row gx-0">
          <div className="organization-page-sidebar col ">
            <div className="workspace-nav-list-wrap">
              {sideBarNavs.map((item, index) => {
                const Wrapper = ({ children }) => <>{children}</>;
                return (
                  <Wrapper key={index}>
                    <Link
                      to={`/${workspaceId}/workspace-settings/${item.toLowerCase().replace(/\s+/g, '-')}`} // Update the URL path here
                      key={index}
                      style={{
                        textDecoration: 'none',
                        border: 'none',
                        color: 'inherit',
                        outline: 'none',
                        backgroundColor: 'inherit',
                      }}
                    >
                      {admin && (
                        <FolderList
                          className="workspace-settings-nav-items"
                          key={index}
                          onClick={() => {
                            setSelectedTab(defaultOrgName(item));
                            if (item == 'Users') updateSidebarNAV('Users');
                            else updateSidebarNAV(item);
                          }}
                          selectedItem={selectedTab == defaultOrgName(item)}
                          renderBadgeForItems={['Workspace constants']}
                          renderBadge={() => (
                            <span
                              style={{ width: '40px', textTransform: 'lowercase' }}
                              className="badge bg-color-primary badge-pill"
                            >
                              new
                            </span>
                          )}
                          dataCy={item.toLowerCase().replace(/\s+/g, '-')}
                        >
                          {item}
                        </FolderList>
                      )}
                    </Link>
                  </Wrapper>
                );
              })}
            </div>
            <OrganizationList />
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
