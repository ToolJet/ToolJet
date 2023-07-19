import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import Layout from '@/_ui/Layout';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageSSO } from '@/ManageSSO';
import { ManageOrgVars } from '@/ManageOrgVars';
import { CustomStylesEditor } from '@/CustomStylesEditor';
import { authenticationService } from '@/_services';
import { CopilotSetting } from '@/CopilotSettings';
import { BreadCrumbContext } from '../App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { OrganizationList } from '../_components/OrganizationManager/List';
import { licenseService } from '../_services/license.service';
import { LicenseBanner } from '@/LicenseBanner';

export function OrganizationSettings(props) {
  const [admin, setAdmin] = useState(authenticationService.currentSessionValue?.admin);
  const [selectedTab, setSelectedTab] = useState(admin ? 'Users & permissions' : 'manageEnvVars');
  const [featureAccess, setFeatureAccess] = useState({});
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const sideBarNavs = ['Users', 'Groups', 'SSO', 'Workspace variables', 'Copilot', 'Custom styles'];
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
      case 'Custom styles':
        return 'manageCustomstyles';
      default:
        return groupName;
    }
  };

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
    });
  };

  useEffect(() => {
    fetchFeatureAccess();
    const subscription = authenticationService.currentSession.subscribe((newOrd) => {
      setAdmin(newOrd?.admin);
      admin ? updateSidebarNAV('Users & permissions') : updateSidebarNAV('Workspace variables');
    });

    () => subscription.unsubsciption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticationService.currentSessionValue?.admin]);

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper organization-settings-page">
        <div className="row gx-0">
          <div className="organization-page-sidebar col ">
            <div className="workspace-nav-list-wrap">
              {sideBarNavs.map((item, index) => {
                return (
                  <>
                    {(admin || item == 'Workspace variables' || item == 'Copilot') && (
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
            <LicenseBanner
              limits={featureAccess}
              classes="m-3 trial-banner"
              size="xsmall"
              type={featureAccess?.licenseStatus?.licenseType}
            />
            <OrganizationList />
          </div>

          <div className={cx('col workspace-content-wrapper')} style={{ paddingTop: '40px' }}>
            <div className="w-100">
              {selectedTab === 'Users & permissions' && <ManageOrgUsers darkMode={props.darkMode} />}
              {selectedTab === 'manageGroups' && <ManageGroupPermissions darkMode={props.darkMode} />}
              {selectedTab === 'manageSSO' && <ManageSSO />}
              {selectedTab === 'manageEnvVars' && <ManageOrgVars darkMode={props.darkMode} />}
              {selectedTab === 'manageCopilot' && <CopilotSetting />}
              {selectedTab === 'manageCustomstyles' && <CustomStylesEditor darkMode={props.darkMode} />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
