import React, { useState, useEffect, useContext } from 'react';
import cx from 'classnames';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services/authentication.service';
import { BreadCrumbContext } from '@/App/App';
import { OrganizationList } from '@/_components/OrganizationManager/List';
import FolderList from '@/_ui/FolderList/FolderList';
import { LicenseBanner } from '@/LicenseBanner';
import { licenseService } from '@/_services';
import Skeleton from 'react-loading-skeleton';

export function InstanceSettings(props) {
  const [featureAccess, setFeatureAccess] = useState({});
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const { load_app } = authenticationService.currentSessionValue;
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const navigate = useNavigate();
  const location = useLocation();

  const sideBarNavs = ['All users', 'Manage instance settings', 'White labelling', 'License'];

  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'all-users':
        return 'All users';
      case 'manage-instance-settings':
      case 'instance-settings':
        return 'Manage instance settings';
      case 'white-labelling':
        return 'White labelling';
      case 'License':
      case 'license':
        return 'License';
      default:
        return groupName;
    }
  };

  const [selectedTab, setSelectedTab] = useState('All users');

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess({ ...data });
      setLicenseLoaded(true);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchFeatureAccess(true);

      if (load_app) {
        const selectedTabFromRoute = location.pathname.split('/').pop();
        if (selectedTabFromRoute === 'instance-settings') {
          setSelectedTab('Users');
          navigate(`/instance-settings/all-users`);
        } else {
          setSelectedTab(defaultOrgName(selectedTabFromRoute));
        }
        updateSidebarNAV(defaultOrgName(selectedTabFromRoute));
      }
    };

    fetchData();
  }, [navigate, load_app]);

  return (
    load_app === true && (
      <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
        <div className="wrapper organization-settings-page">
          <div className="row gx-0">
            <div className="organization-page-sidebar col">
              <div className="workspace-nav-list-wrap">
                {licenseLoaded ? (
                  sideBarNavs.map((item, index) => {
                    const navLink = `/instance-settings/${item.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                      <Link
                        to={navLink}
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
                          onClick={() => {
                            setSelectedTab(defaultOrgName(item));
                            updateSidebarNAV(item);
                          }}
                          selectedItem={selectedTab === defaultOrgName(item)}
                          dataCy={item.toLowerCase().replace(/\s+/g, '-')}
                        >
                          {item}
                        </FolderList>
                      </Link>
                    );
                  })
                ) : (
                  <Skeleton count={3} height={22} />
                )}
              </div>
              <LicenseBanner
                limits={featureAccess}
                classes="m-3 trial-banner"
                size="xsmall"
                type={featureAccess?.licenseStatus?.licenseType}
              />
              <OrganizationList />
            </div>

            {licenseLoaded ? (
              <div className={cx('col workspace-content-wrapper')} style={{ paddingTop: '40px' }}>
                <div className="w-100">
                  <Outlet />
                </div>
              </div>
            ) : (
              <div className="col workspace-content-wrapper">
                <div style={{ width: '880px', margin: 'auto', marginTop: '150px' }}>
                  <Skeleton className="mb-2" />
                  <Skeleton className="mb-2" />
                  <Skeleton className="mb-2" />
                  <Skeleton />
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    )
  );
}
