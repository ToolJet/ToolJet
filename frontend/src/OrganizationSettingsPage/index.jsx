import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services';
import { BreadCrumbContext } from '../App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { OrganizationList } from '../_components/OrganizationManager/List';
import { workspaceSettingsLinks } from './constant';

export function OrganizationSettings(props) {
  const admin = authenticationService.currentSessionValue?.admin;
  const [selectedTab, setSelectedTab] = useState(admin ? workspaceSettingsLinks[0].id : 'workspacevariables');
  const navigate = useNavigate();
  const location = useLocation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const [conditionObj, setConditionObj] = useState({ admin: authenticationService.currentSessionValue?.admin });

  const checkConditions = (conditions, conditionsObj) => {
    if (!conditions || conditions.length === 0) {
      return true;
    }
    return conditions.every((condition) => conditionsObj?.[condition] === true);
  };

  //Filtered Links from the workspace settings links array
  const filteredLinks = () =>
    workspaceSettingsLinks.filter((item) => {
      return checkConditions(item.conditions, conditionObj);
    });

  const getMenuFromRoute = (route) => {
    return workspaceSettingsLinks?.find((e) => e.route === route) || {};
  };

  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe((newOrd) => {
      setConditionObj({ admin: newOrd?.admin });
    });
    const selectedTabFromRoute = location.pathname.split('/').pop();
    if (selectedTabFromRoute === 'workspace-settings') {
      // No Sub routes added loading first one
      setSelectedTab(admin ? workspaceSettingsLinks[0].id : 'workspacevariables');
    } else {
      setSelectedTab(getMenuFromRoute(selectedTabFromRoute)?.id);
    }

    return () => subscription.unsubscribe();
  }, [authenticationService.currentSessionValue?.admin]);

  useEffect(() => {
    const menu = workspaceSettingsLinks?.find((m) => m.id === selectedTab);
    updateSidebarNAV(menu?.name || '');
    navigate(menu?.route || '');
  }, [selectedTab]);

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
                          setSelectedTab(item.id);
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
