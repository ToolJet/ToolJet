import React, { useEffect, useState, useContext } from 'react';
import { useParams, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import cx from 'classnames';
import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services';
import { BreadCrumbContext } from '../App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { OrganizationList } from '../_components/OrganizationManager/List';
import { licenseService } from '../_services/license.service';
import { LicenseBanner } from '@/LicenseBanner';
import Skeleton from 'react-loading-skeleton';
import { getWorkspaceId } from '@/_helpers/utils';
import OrganizationLogin from '@/_components/OrganizationLogin/OrganizationLogin';

export function OrganizationSettings(props) {
  const [admin, setAdmin] = useState(authenticationService.currentSessionValue?.admin);
  const [featureAccess, setFeatureAccess] = useState({});
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const [selectedTab, setSelectedTab] = useState('Users');
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const enableWorkspaceConfiguration = window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true';
  const sideBarNavs = [
    'Users',
    'Groups',
    ...(enableWorkspaceConfiguration ? ['Workspace login'] : []),
    'Workspace variables',
    'Copilot',
    'Custom styles',
    'Configure git',
  ];
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
      case 'copilot':
        return 'Copilot';
      case 'custom-styles':
        return 'Custom styles';
      case 'configure-git':
        return 'Configure git';
      default:
        return groupName;
    }
  };

  if (!admin) {
    navigate('/');
  }

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess(data);
      setFeaturesLoaded(true);
    });
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

  useEffect(() => {
    const fetchData = async () => {
      await fetchFeatureAccess();
      const subscription = authenticationService.currentSession.subscribe((newOrd) => {
        setAdmin(newOrd?.admin);
      });
      admin ? updateSidebarNAV('Users') : updateSidebarNAV('Workspace variables');

      () => subscription.unsubsciption();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (featuresLoaded) {
        const selectedTabFromRoute = location.pathname.split('/').pop();
        if (selectedTabFromRoute === 'workspace-settings') {
          setSelectedTab(admin ? 'Users' : 'Workspace variables');
          navigate(
            admin
              ? `/${workspaceId}/workspace-settings/users`
              : `/${workspaceId}/workspace-settings/workspace-variables`
          );
        } else {
          setSelectedTab(defaultOrgName(selectedTabFromRoute));
        }
        updateSidebarNAV(defaultOrgName(selectedTabFromRoute));
      }
    };
    fetchData();
  }, [featuresLoaded, navigate, workspaceId, authenticationService.currentSessionValue?.admin]);

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <div className="wrapper organization-settings-page">
        <div className="row gx-0">
          <div className="organization-page-sidebar col ">
            <div className="workspace-nav-list-wrap">
              {featuresLoaded ? (
                sideBarNavs.map((item, index) => {
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
                        {(admin ||
                          item == 'Workspace variables' ||
                          item == 'Copilot' ||
                          item == 'Workspace constants') && (
                          <FolderList
                            className="workspace-settings-nav-items"
                            key={index}
                            onClick={() => {
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
                })
              ) : (
                <Skeleton count={7} height={22} />
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

          {featuresLoaded ? (
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
                <Skeleton className="mb-2" />
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
  );
}
