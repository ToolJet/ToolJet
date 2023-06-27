import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import Layout from '@/_ui/Layout';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageSSO } from '@/ManageSSO';
import { ManageOrgVars } from '@/ManageOrgVars';
import { authenticationService } from '@/_services';
import { CopilotSetting } from '@/CopilotSettings';
import { BreadCrumbContext } from '../App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { OrganizationList } from '../_components/OrganizationManager/List';
import { ManageOrgConstants } from '@/ManageOrgConstants';

export function OrganizationSettings(props) {
  const [admin, setAdmin] = useState(authenticationService.currentSessionValue?.admin);
  const [selectedTab, setSelectedTab] = useState(admin ? 'Users & permissions' : 'manageEnvVars');
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const sideBarNavs = ['Users', 'Groups', 'SSO', 'Workspace variables', 'Copilot', 'Workspace Constants'];
  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'Users':
        return 'Users & permissions';
      case 'Groups':
        return 'manageGroups';
      case 'SSO':
        return 'manageSSO';
      case 'Workspace variables':
        return 'manageEnvVars';
      case 'Copilot':
        return 'manageCopilot';
      case 'Workspace Constants':
        return 'manageOrgConstants';
      default:
        return groupName;
    }
  };

  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe((newOrd) => {
      setAdmin(newOrd?.admin);
      admin ? updateSidebarNAV('Users & permissions') : updateSidebarNAV('Workspace variables');
    });

    () => subscription.unsubsciption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticationService.currentSessionValue?.admin]);

  const goTooOrgConstantsDashboard = () => {
    setSelectedTab('manageOrgConstants');
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
                    {(admin || item == 'Workspace variables' || item == 'Copilot' || item == 'Workspace Constants') && (
                      <FolderList
                        className="workspace-settings-nav-items"
                        key={index}
                        onClick={() => {
                          setSelectedTab(defaultOrgName(item));
                          if (item == 'Users') updateSidebarNAV('Users & permissions');
                          else updateSidebarNAV(item);
                        }}
                        selectedItem={selectedTab == defaultOrgName(item)}
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
              {selectedTab === 'manageSSO' && <ManageSSO />}
              {selectedTab === 'manageEnvVars' && (
                <ManageOrgVars darkMode={props.darkMode} goTooOrgConstantsDashboard={goTooOrgConstantsDashboard} />
              )}
              {selectedTab === 'manageCopilot' && <CopilotSetting />}
              {selectedTab === 'manageOrgConstants' && <ManageOrgConstants darkMode={props.darkMode} />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
