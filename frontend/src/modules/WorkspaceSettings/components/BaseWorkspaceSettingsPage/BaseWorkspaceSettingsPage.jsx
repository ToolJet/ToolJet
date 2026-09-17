import React, { useEffect, useState, useContext } from 'react';
import cx from 'classnames';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchEdition } from '@/modules/common/helpers/utils';
import Layout from '@/_ui/Layout';
import { authenticationService, licenseService } from '@/_services';
import FolderList from '@/_ui/FolderList/FolderList';
import { redirectToErrorPage } from '@/_helpers/routes';
import { ERROR_TYPES } from '@/_helpers/constants';
import { BreadCrumbContext } from '@/App/App';
import { checkConditionsForRoute } from '@/_helpers/utils';
import { OrganizationList } from '@/modules/dashboard/components';

export default function WorkspaceSettingsPage({ extraLinks, ...props }) {
  const workspaceSettingsLinks = constructWorkspaceSettingsLinks(extraLinks);
  const admin = authenticationService.currentSessionValue?.admin;
  const [selectedTab, setSelectedTab] = useState(admin ? workspaceSettingsLinks[0].id : 'workspacevariables');
  const location = useLocation();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const navigate = useNavigate();
  const edition = fetchEdition();
  const isEEorCloud = edition === 'ee' || edition === 'cloud';
  const [featureAccess, setFeatureAccess] = useState(null);

  useEffect(() => {
    licenseService
      .getFeatureAccess()
      .then(setFeatureAccess)
      .catch(() => setFeatureAccess({}));
  }, []);

  const hasCustomGroupsLicense =
    featureAccess !== null &&
    featureAccess.customGroups === true &&
    featureAccess.licenseStatus?.isLicenseValid !== false;

  // null = not yet fetched; {} = fetch failed (fail open — show Groups tab)

  const [conditionObj, setConditionObj] = useState(() => {
    const current = authenticationService.currentSessionValue || {};
    const isAdmin = !!current.admin;
    const isBuilder = !!current.user_permissions?.is_builder;
    const isGroupAdmin = !!current.is_group_admin;
    return {
      admin: isAdmin,
      isBuilder,
      isGroupAdmin,
      wsLoginEnabled: window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true',
      canAccessThemes: isEEorCloud && (isAdmin || isBuilder),
      canManageGroups: isAdmin || (isGroupAdmin && hasCustomGroupsLicense),
    };
  });

  //Filtered Links from the workspace settings links array
  const filteredLinks = () =>
    workspaceSettingsLinks.filter((item) => {
      const effectiveConditionObj = {
        ...conditionObj,
        canManageGroups: conditionObj.admin || (conditionObj.isGroupAdmin && hasCustomGroupsLicense),
      };
      return checkConditionsForRoute(item.conditions, effectiveConditionObj);
    });

  const getMenuFromRoute = (route) => {
    return workspaceSettingsLinks?.find((e) => e.route === route) || {};
  };

  useEffect(() => {
    const subscription = authenticationService.currentSession.subscribe((newOrd) => {
      const isAdmin = !!newOrd?.admin;
      const isBuilder = !!newOrd?.user_permissions?.is_builder;
      const isGroupAdmin = !!newOrd?.is_group_admin;
      const editionNow = fetchEdition();
      const isEEorCloudNow = editionNow === 'ee' || editionNow === 'cloud';
      setConditionObj({
        admin: isAdmin,
        isBuilder,
        isGroupAdmin,
        wsLoginEnabled: window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true',
        canAccessThemes: isEEorCloudNow && (isAdmin || isBuilder),
        canManageGroups: isAdmin || (isGroupAdmin && hasCustomGroupsLicense),
      });
    });

    const pathParts = location.pathname.split('/').filter(Boolean);
    const selectedTabFromRoute = pathParts.pop();
    const availableLinks = filteredLinks();

    if (selectedTabFromRoute === 'workspace-settings') {
      if (availableLinks.length > 0) {
        let target = availableLinks[0];

        if (conditionObj.isGroupAdmin) {
          const groupsLink = availableLinks.find((l) => l.id === 'groups');
          if (groupsLink) target = groupsLink;
        } else if (!admin && conditionObj.isBuilder) {
          const themesLink = availableLinks.find((l) => l.id === 'themes');
          if (themesLink) target = themesLink;
        }

        setSelectedTab(target.id);
        navigate(target.route, { replace: true });
      }
    } else {
      const FieldDisabled = window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'false';
      if (FieldDisabled && selectedTabFromRoute === 'workspace-login') {
        redirectToErrorPage(ERROR_TYPES.WORKSPACE_LOGIN_RESTRICTED);
      }
      const selectedWorkspaceSetting = availableLinks?.find((m) => m.id === selectedTabFromRoute);
      console.log(selectedWorkspaceSetting, 'selectedWorkspaceSetting');
      updateSidebarNAV(selectedWorkspaceSetting?.name || '');
      setSelectedTab(getMenuFromRoute(selectedWorkspaceSetting)?.id);
    }

    return () => subscription.unsubscribe();
  }, [admin, location.pathname, conditionObj.isBuilder, conditionObj.isGroupAdmin, featureAccess]);

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
            <OrganizationList />
          </div>

          <div
            className={cx('col workspace-content-wrapper')}
            style={{ paddingTop: '40px', scrollbarGutter: 'stable' }}
          >
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
    { id: 'groups', name: 'Groups', route: 'groups', conditions: ['canManageGroups'] },
    {
      id: 'workspace-login',
      name: 'Workspace login',
      route: 'workspace-login',
      conditions: ['admin', 'wsLoginEnabled'],
    },
    ...(extraLinks ? extraLinks : []),
  ];
  return commonLinks;
}
