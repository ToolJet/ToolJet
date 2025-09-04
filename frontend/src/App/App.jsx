import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { authorizeWorkspace, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { authenticationService, tooljetService, licenseService } from '@/_services';
import { withRouter } from '@/_hoc/withRouter';
import { PrivateRoute, AdminRoute, AppsRoute, SwitchWorkspaceRoute } from '@/Routes';
import { HomePage } from '@/HomePage';
import { TooljetDatabase } from '@/TooljetDatabase';
import { Authorize } from '@/Oauth2';
import { Authorize as Oauth } from '@/Oauth';
import { Viewer } from '@/AppBuilder/Viewer/Viewer.jsx';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { MarketplacePage } from '@/MarketplacePage';
import { InstalledPlugins } from '@/MarketplacePage/InstalledPlugins';
import { MarketplacePlugins } from '@/MarketplacePage/MarketplacePlugins';
import SwitchWorkspacePage from '@/HomePage/SwitchWorkspacePage';
import { lt } from 'semver';
import Toast from '@/_ui/Toast';
import '@/_styles/theme.scss';
import AppLoader from '@/AppLoader';
export const BreadCrumbContext = React.createContext({});
import 'react-tooltip/dist/react-tooltip.css';
import { getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import ErrorPage from '@/_components/ErrorComponents/ErrorPage';
import WorkspaceConstants from '@/WorkspaceConstants';
import { useAppDataStore } from '@/_stores/appDataStore';
import cx from 'classnames';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { setFaviconAndTitle } from '@white-label/whiteLabelling';
import {
  onboarding,
  auth,
  WorkspaceSettings,
  InstanceSettings,
  Settings,
  Workflows,
  getDataSourcesRoutes,
  getAuditLogsRoutes,
} from '@/modules';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { checkIfToolJetCloud } from '@/_helpers/utils';
import { BasicPlanMigrationBanner } from '@/HomePage/BasicPlanMigrationBanner/BasicPlanMigrationBanner';
import EmbedApp from '@/AppBuilder/EmbedApp';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import hubspotHelper from '@/modules/common/helpers/hubspotHelper';
import { isMobileDevice } from '@/_helpers/appUtils';
import { MobileEmptyState } from '@/Routes/MobileBlock';

const AppWrapper = (props) => {
  const { isAppDarkMode } = useAppDarkMode();
  const { updateIsTJDarkMode, isTJDarkMode } = useStore(
    (state) => ({
      updateIsTJDarkMode: state.updateIsTJDarkMode,
      isTJDarkMode: state.isTJDarkMode,
    }),
    shallow
  );
  return (
    <Suspense fallback={null}>
      <BrowserRouter basename={window.public_config?.SUB_PATH || '/'}>
        <AppWithRouter
          props={props}
          isAppDarkMode={isAppDarkMode} // This is the dark mode only for appbuilder's canvas + viewer
          darkMode={isTJDarkMode} // This is the dark mode of entire platform
          updateIsTJDarkMode={updateIsTJDarkMode}
        />
      </BrowserRouter>
    </Suspense>
  );
};

class AppComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      fetchedMetadata: false,
      darkMode: localStorage.getItem('darkMode') === 'true',
      showBanner: false,
      // isEditorOrViewer: '',
    };
  }
  updateSidebarNAV = (val) => {
    this.setState({ sidebarNav: val });
  };
  updateMargin() {
    const isAdmin = authenticationService?.currentSessionValue?.admin;
    const isBuilder = authenticationService?.currentSessionValue?.is_builder;
    const setupDate = authenticationService?.currentSessionValue?.consultation_banner_date;
    const showBannerCondition =
      (isAdmin || isBuilder) && setupDate && this.isExistingPlanUser(setupDate) && this.state.showBanner;
    const marginValue = showBannerCondition ? '25' : '0';
    const marginValueLayout = showBannerCondition ? '35' : '0';
    document.documentElement.style.setProperty('--dynamic-margin', `${marginValue}px`);
    document.documentElement.style.setProperty('--dynamic-margin-2', `${marginValueLayout}px`);
  }

  fetchMetadata = () => {
    tooljetService.fetchMetaData().then((data) => {
      updateCurrentSession({
        instance_id: data?.instance_id,
      });
      useAppDataStore.getState().actions.setMetadata(data);
      localStorage.setItem('currentVersion', data.installed_version);
      this.setState({ tooljetVersion: data.installed_version });
      if (data.latest_version && lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
        this.setState({ updateAvailable: true });
      }
    });
  };

  initTelemetryAndSupport(currentUser) {
    posthogHelper.initPosthog(currentUser);
  }

  async componentDidMount() {
    setFaviconAndTitle();
    authorizeWorkspace();
    hubspotHelper.loadHubspot();
    this.fetchMetadata();
    setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);
    this.updateMargin(); // Set initial margin
    const featureAccess = await licenseService.getFeatureAccess();
    const isBasicPlan = !featureAccess?.licenseStatus?.isLicenseValid || featureAccess?.licenseStatus?.isExpired;
    this.setState({ showBanner: isBasicPlan });
    this.updateColorScheme();
    let counter = 0;
    let interval;

    interval = setInterval(async () => {
      ++counter;
      const current_user = authenticationService.currentSessionValue?.current_user;
      if (current_user?.id) {
        this.initTelemetryAndSupport(current_user); //Call when currentuser is available
        clearInterval(interval);
      } else if (counter > 10) {
        clearInterval(interval);
      }
    }, 1000);
  }
  // check if its getting routed from editor
  checkPreviousRoute = (route) => {
    if (route.includes('/apps')) {
      return true;
    }
    return false;
  };

  componentDidUpdate(prevProps, prevState) {
    // Check if the current location is the dashboard (homepage)
    if (
      this.props.location.pathname === `/${getWorkspaceIdOrSlugFromURL()}` &&
      prevProps.location.pathname !== `/${getWorkspaceIdOrSlugFromURL()}` &&
      this.checkPreviousRoute(prevProps.location.pathname) &&
      prevProps.location.pathname !== `/:workspaceId`
    ) {
      // Reload the page for clearing already set intervals
      window.location.reload();
    }
    // Update margin when showBanner changes
    this.updateMargin();
    // Update color scheme if darkMode changed
    if (prevProps.darkMode !== this.props.darkMode) {
      this.updateColorScheme();
    }
  }

  switchDarkMode = (newMode) => {
    this.props.updateIsTJDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    this.updateColorScheme(newMode);
  };

  isEditorOrViewerFromPath = () => {
    const pathname = this.props.location.pathname;
    if (pathname.includes('/apps/')) {
      return 'editor';
    }
    if (pathname.includes('/applications/') || pathname.includes('/embed-apps/')) {
      return 'viewer';
    }
    return '';
  };
  closeBasicPlanMigrationBanner = () => {
    this.setState({ showBanner: false });
  };
  isExistingPlanUser = (date) => {
    return new Date(date) < new Date('2025-04-24'); //show banner if user created before 2 april (24 for testing)
  };
  updateColorScheme = (darkModeValue) => {
    const isDark = darkModeValue !== undefined ? darkModeValue : this.props.darkMode;
    if (isDark) {
      document.documentElement.style.setProperty('color-scheme', 'dark');
    } else {
      document.documentElement.style.removeProperty('color-scheme');
    }
  };
  render() {
    const { updateAvailable, isEditorOrViewer, showBanner } = this.state;
    const { darkMode } = this.props;
    const mergedProps = {
      ...this.props,
      switchDarkMode: this.switchDarkMode,
      darkMode: darkMode,
    };

    // Check if user is on mobile device - show empty state for all protected routes
    if (isMobileDevice()) {
      return <MobileEmptyState darkMode={darkMode} />;
    }

    let toastOptions = {
      style: {
        wordBreak: 'break-all',
      },
    };

    if (isEditorOrViewer === 'viewer' ? this.props.isAppDarkMode : darkMode) {
      toastOptions = {
        className: 'toast-dark-mode',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          wordBreak: 'break-all',
        },
      };
    }
    const { sidebarNav } = this.state;
    const { updateSidebarNAV } = this;
    const isApplicationsPath = window.location.pathname.includes('/applications/');
    const isAdmin = authenticationService?.currentSessionValue?.admin;
    const isBuilder = authenticationService?.currentSessionValue?.is_builder;
    const setupDate = authenticationService?.currentSessionValue?.consultation_banner_date;
    return (
      <>
        <div className={!isApplicationsPath && (isAdmin || isBuilder) ? 'banner-layout-wrapper' : ''}>
          {!isApplicationsPath &&
            (isAdmin || isBuilder) &&
            showBanner &&
            setupDate &&
            this.isExistingPlanUser(setupDate) && (
              <BasicPlanMigrationBanner darkMode={darkMode} closeBanner={this.closeBasicPlanMigrationBanner} />
            )}
          <div
            className={cx('main-wrapper', {
              'theme-dark dark-theme': !this.isEditorOrViewerFromPath() && darkMode,
            })}
            data-cy="main-wrapper"
          >
            {updateAvailable && (
              <div className="alert alert-info alert-dismissible" role="alert">
                <h3 className="mb-1">Update available</h3>
                <p>A new version of ToolJet has been released.</p>
                <div className="btn-list">
                  <a
                    href="https://docs.tooljet.io/docs/setup/updating"
                    target="_blank"
                    className="btn btn-info"
                    rel="noreferrer"
                  >
                    Read release notes & update
                  </a>
                  <a
                    onClick={() => {
                      tooljetService.skipVersion();
                      this.setState({ updateAvailable: false });
                    }}
                    className="btn"
                  >
                    Skip this version
                  </a>
                </div>
              </div>
            )}
            <BreadCrumbContext.Provider value={{ sidebarNav, updateSidebarNAV }}>
              <Routes>
                {onboarding({ ...this.props, darkMode })}
                {auth({ ...this.props, darkMode })}
                <Route
                  path="/sso/:origin/:configId"
                  exact
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <Oauth {...this.props} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/sso/:origin"
                  exact
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <Oauth {...this.props} />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/:workspaceId/apps/:slug/:pageHandle?/*"
                  element={
                    <AppsRoute componentType="editor" darkMode={darkMode}>
                      <AppLoader switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </AppsRoute>
                  }
                />
                <Route
                  exact
                  path="/:workspaceId/workspace-constants"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <WorkspaceConstants switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/applications/:slug/:pageHandle?"
                  element={
                    <AppsRoute componentType="viewer">
                      <Viewer switchDarkMode={this.switchDarkMode} darkMode={this.props.isAppDarkMode} />
                    </AppsRoute>
                  }
                />
                <Route
                  exact
                  path="/applications/:slug/versions/:versionId/environments/:environmentId/:pageHandle?"
                  element={
                    <AppsRoute componentType="viewer">
                      <Viewer switchDarkMode={this.switchDarkMode} darkMode={this.props.isAppDarkMode} />
                    </AppsRoute>
                  }
                />
                <Route
                  exact
                  path="/oauth2/authorize"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <Authorize switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />
                {isWorkflowsFeatureEnabled() && (
                  <Route
                    exact
                    path="/:workspaceId/workflows/*"
                    element={
                      <PrivateRoute darkMode={darkMode}>
                        <Workflows switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                      </PrivateRoute>
                    }
                  />
                )}
                <Route
                  path="/:workspaceId/workspace-settings/*"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <WorkspaceSettings {...mergedProps} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="settings/*"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <InstanceSettings switchDarkMode={this.switchDarkMode} darkMode={darkMode} {...this.props} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/:workspaceId/settings/*"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <InstanceSettings {...this.props} darkMode={darkMode} switchDarkMode={this.switchDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/:workspaceId/modules"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <HomePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} appType={'module'} />
                    </PrivateRoute>
                  }
                />

                {getAuditLogsRoutes({ ...mergedProps, darkMode })}
                <Route
                  exact
                  path="/:workspaceId/profile-settings"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <SettingsPage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />
                {getDataSourcesRoutes({ ...mergedProps, darkMode })}
                <Route
                  exact
                  path="/applications/:id/versions/:versionId/:pageHandle?"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <Viewer switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/applications/:slug/:pageHandle?"
                  element={
                    <PrivateRoute>
                      <Viewer switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />

                <Route
                  exact
                  path="/:workspaceId/database"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <TooljetDatabase switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />

                {this.state.tooljetVersion && !checkIfToolJetCloud(this.state.tooljetVersion) && (
                  <Route
                    exact
                    path="/integrations"
                    element={
                      <AdminRoute {...this.props} darkMode={darkMode}>
                        <MarketplacePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                      </AdminRoute>
                    }
                  >
                    <Route path="installed" element={<InstalledPlugins />} />
                    <Route path="marketplace" element={<MarketplacePlugins />} />/
                  </Route>
                )}

                <Route
                  exact
                  path="/"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <Navigate to="/:workspaceId" />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/error/:errorType"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <ErrorPage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/app-url-archived"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <SwitchWorkspacePage
                        switchDarkMode={this.switchDarkMode}
                        darkMode={darkMode}
                        archived={true}
                        isAppUrl={true}
                      />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/switch-workspace"
                  element={
                    <SwitchWorkspaceRoute darkMode={darkMode}>
                      <SwitchWorkspacePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </SwitchWorkspaceRoute>
                  }
                />
                <Route
                  exact
                  path="/switch-workspace-archived"
                  element={
                    <SwitchWorkspaceRoute darkMode={darkMode}>
                      <SwitchWorkspacePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} archived={true} />
                    </SwitchWorkspaceRoute>
                  }
                />
                <Route
                  exact
                  path="/:workspaceId"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <HomePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} appType={'front-end'} />
                    </PrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/embed-apps/:appId"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      <EmbedApp />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <PrivateRoute darkMode={darkMode}>
                      {(() => {
                        if (authenticationService?.currentSessionValue?.current_organization_id) {
                          return <Navigate to="/:workspaceId" />;
                        }
                        return <Navigate to="/login" />;
                      })()}
                    </PrivateRoute>
                  }
                />
              </Routes>
            </BreadCrumbContext.Provider>
            <div id="modal-div" />
          </div>

          <Toast toastOptions={toastOptions} />
        </div>
      </>
    );
  }
}

export const App = AppWrapper;
const AppWithRouter = withRouter(AppComponent);
