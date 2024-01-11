import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link, Outlet, useSearchParams } from 'react-router-dom';
import cx from 'classnames';
import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services/authentication.service';
import { toast } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/App';
import { OrganizationList } from '@/_components/OrganizationManager/List';
import FolderList from '@/_ui/FolderList/FolderList';
import { LicenseTooltip } from '@/LicenseTooltip';
import { LicenseBannerCloud } from '@/LicenseBannerCloud';
import { licenseService } from '@/_services';
import Skeleton from 'react-loading-skeleton';

export function Settings(props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [featureAccess, setFeatureAccess] = useState({});
  const [licenseLoaded, setLicenseLoaded] = useState(false);
  const error = searchParams.get('error');
  const licenseCheck = searchParams.get('save_license');
  const whiteLabelsCheck = searchParams.get('save_whiteLabelling');
  const [selectedTab, setSelectedTab] = useState('Subscription');
  const { load_app } = authenticationService.currentSessionValue;
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const sideBarNavs = ['White labelling', 'Subscription'];

  const defaultOrgName = (groupName) => {
    switch (groupName) {
      case 'subscription':
        return 'Subscription';
      case 'white-labelling':
        return 'White labelling';
      default:
        return groupName;
    }
  };

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess({ ...data });
      if (data.licenseStatus.isExpired || !data.licenseStatus.isLicenseValid) {
        setSelectedTab('subscription');
        updateSidebarNAV('Subscription');
      }
      setLicenseLoaded(true);
    });
  };

  useEffect(() => {
    fetchFeatureAccess(true);
    if (load_app) {
      switch (true) {
        case error === 'license':
          toast.error('Your subscription has expired. Please update your license key');
          break;
        case licenseCheck === 'success':
          toast.success('Subscription key has been updated', {
            position: 'top-center',
          });
          break;
        case whiteLabelsCheck === 'success':
          toast.success('White labelling has been updated', {
            position: 'top-center',
          });
          break;
        default:
          break;
      }
      updateSidebarNAV(selectedTab);
    }
    searchParams.delete('error');
    searchParams.delete('save_license');
    setSearchParams(searchParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (licenseLoaded) {
      const selectedTabFromRoute = location.pathname.split('/').pop();
      if (selectedTabFromRoute === 'settings') {
        setSelectedTab('White labelling');
        navigate(`/${workspaceId}/settings/white-labelling`);
      } else {
        setSelectedTab(defaultOrgName(selectedTabFromRoute));
      }
      updateSidebarNAV(defaultOrgName(selectedTabFromRoute));
    }
  }, [licenseLoaded, navigate]);

  return (
    load_app === true && (
      <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
        <div className="wrapper organization-settings-page">
          <div className="row gx-0">
            <div className="organization-page-sidebar col ">
              <div className="workspace-nav-list-wrap">
                {licenseLoaded ? (
                  sideBarNavs.map((item, index) => {
                    const navLink = `/${workspaceId}/settings/${item.toLowerCase().replace(/\s+/g, '-')}`;
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
              <LicenseBannerCloud
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
