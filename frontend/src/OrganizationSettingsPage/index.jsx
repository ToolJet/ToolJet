import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { useNavigate } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageOrgVars } from '@/ManageOrgVars';
import { authenticationService } from '@/_services';
import { CopilotSetting } from '@/CopilotSettings';
import { BreadCrumbContext } from '../App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { OrganizationList } from '../_components/OrganizationManager/List';
import { getWorkspaceId } from '@/_helpers/utils';
import OrganizationLogin from '@/_components/OrganizationLogin/OrganizationLogin';

export function OrganizationSettings(props) {
  const [admin, setAdmin] = useState(authenticationService.currentSessionValue?.admin);
  const [selectedTab, setSelectedTab] = useState(admin ? 'Users & permissions' : 'manageEnvVars');
  const navigate = useNavigate();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const sideBarNavs = ['Users', 'Groups', 'Workspace login', 'Workspace variables'];
  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'Users':
        return 'Users & permissions';
      case 'Groups':
        return 'manageGroups';
      case 'Workspace login':
        return 'manageWorkspaceLogin';
      case 'Workspace variables':
        return 'manageEnvVars';
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
    updateSidebarNAV('Users');

    () => subscription.unsubsciption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticationService.currentSessionValue?.admin]);

  const goTooOrgConstantsDashboard = () => {
    navigate(`/${getWorkspaceId()}/workspace-constants`);
  };

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper organization-settings-page">
        <div className="row gx-0">
          <div className="organization-page-sidebar col ">
            <div className="workspace-nav-list-wrap">
              {sideBarNavs.map((item, index) => {
                return (
                  <>
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
                  </>
                );
              })}
            </div>
            <OrganizationList />
          </div>

          <div className={cx('col workspace-content-wrapper')} style={{ paddingTop: '40px' }}>
            <div className="w-100">
              {selectedTab === 'Users & permissions' && <ManageOrgUsers darkMode={props.darkMode} />}
              {selectedTab === 'manageGroups' && <ManageGroupPermissions darkMode={props.darkMode} />}
              {selectedTab === 'manageWorkspaceLogin' && <OrganizationLogin />}
              {selectedTab === 'manageEnvVars' && (
                <ManageOrgVars darkMode={props.darkMode} goTooOrgConstantsDashboard={goTooOrgConstantsDashboard} />
              )}
              {selectedTab === 'manageCopilot' && <CopilotSetting />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
