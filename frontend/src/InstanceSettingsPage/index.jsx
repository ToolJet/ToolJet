import React, { useState, useEffect, useContext } from 'react';
import cx from 'classnames';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { ManageAllUsers } from '@/ManageAllUsers';
import { ManageInstanceSettings } from '@/ManageInstanceSettings';
import { authenticationService } from '@/_services/authentication.service';
import { toast } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/App';
import { OrganizationList } from '@/_components/OrganizationManager/List';
import FolderList from '@/_ui/FolderList/FolderList';
import { ManageLicenseKey } from '@/ManageLicenseKey';

export function InstanceSettings(props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const error = searchParams.get('error');
  const [selectedTab, setSelectedTab] = useState(error === 'license' ? 'License' : 'Users');
  const { load_app } = authenticationService.currentSessionValue;
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const sideBarNavs = ['All users', 'Manage instance settings', 'License'];
  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'All users':
        return 'Users';
      case 'Manage instance settings':
        return 'Settings';
      default:
        return groupName;
    }
  };

  useEffect(() => {
    load_app && error === 'license' && toast.error('Your license key has expired. Please update your license key');
    load_app && updateSidebarNAV(selectedTab);
    searchParams.delete('error');
    setSearchParams(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    load_app === true && (
      <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
        <div className="wrapper organization-settings-page">
          <div className="row gx-0">
            <div className="organization-page-sidebar col ">
              <div className="workspace-nav-list-wrap">
                {sideBarNavs.map((item, index) => {
                  return (
                    <FolderList
                      className="workspace-settings-nav-items"
                      key={index}
                      onClick={() => {
                        setSelectedTab(defaultOrgName(item));
                        updateSidebarNAV(item);
                      }}
                      selectedItem={selectedTab == defaultOrgName(item)}
                      dataCy={item.toLowerCase().replace(/\s+/g, '-')}
                    >
                      {item}
                    </FolderList>
                  );
                })}
              </div>
              <OrganizationList />
            </div>

            <div className={cx('col workspace-content-wrapper')} style={{ paddingTop: '40px' }}>
              <div className="w-100">
                {selectedTab === 'Users' && <ManageAllUsers darkMode={props.darkMode} />}
                {selectedTab === 'Settings' && <ManageInstanceSettings />}
                {selectedTab === 'License' && <ManageLicenseKey />}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  );
}
