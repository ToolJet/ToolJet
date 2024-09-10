import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { authorizeWorkspace } from '@/_helpers/authorizeWorkspace';
import { authenticationService, tooljetService } from '@/_services';
import { withRouter } from '@/_hoc/withRouter';
import { PrivateRoute, AdminRoute, AppsRoute, SwitchWorkspaceRoute, OrganizationInviteRoute } from '@/Routes';
import { HomePage } from '@/HomePage';
import { TooljetDatabase } from '@/TooljetDatabase';
import { Authorize } from '@/Oauth2';
import { Authorize as Oauth } from '@/Oauth';
import { Viewer } from '@/Editor';
import { OrganizationSettings } from '@/OrganizationSettingsPage';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { MarketplacePage } from '@/MarketplacePage';
import SwitchWorkspacePage from '@/HomePage/SwitchWorkspacePage';
import { GlobalDatasources } from '@/GlobalDatasources';
import { lt } from 'semver';
import Toast from '@/_ui/Toast';
import { VerificationSuccessInfoScreen } from '@/SuccessInfoScreen';
import '@/_styles/theme.scss';
import { AppLoader } from '@/AppLoader';
export const BreadCrumbContext = React.createContext({});
import 'react-tooltip/dist/react-tooltip.css';
import { getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import ErrorPage from '@/_components/ErrorComponents/ErrorPage';
import WorkspaceConstants from '@/WorkspaceConstants';
import { useAppDataStore } from '@/_stores/appDataStore';
import cx from 'classnames';
import useAppDarkMode from '@/_hooks/useAppDarkMode';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import OrganizationLogin from '@/_components/OrganizationLogin/OrganizationLogin';
import { ManageOrgVars } from '@/ManageOrgVars';
import { ManageGroupPermissionsV2 } from '@/ManageGroupPermissionsV2/ManageGroupPermissionsV2';
import { setFaviconAndTitle } from '@white-label/whiteLabelling';
import { onboarding, auth } from '@/modules';

const AppWrapper = (props) => {
  const { isAppDarkMode } = useAppDarkMode();
  return (
    <Suspense fallback={null}>
      <BrowserRouter basename={window.public_config?.SUB_PATH || '/'}>
        <AppWithRouter props={props} isAppDarkMode={isAppDarkMode} />
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
      isEditorOrViewer: '',
    };
  }
  updateSidebarNAV = (val) => {
    this.setState({ sidebarNav: val });
  };
  fetchMetadata = () => {
    tooljetService.fetchMetaData().then((data) => {
      useAppDataStore.getState().actions.setMetadata(data);
      localStorage.setItem('currentVersion', data.installed_version);
      if (data.latest_version && lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
        this.setState({ updateAvailable: true });
      }
    });
  };

  componentDidMount() {
    authorizeWorkspace();
    this.fetchMetadata();
    setFaviconAndTitle(null, null, this.props.location);
    setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);
  }
  // check if its getting routed from editor
  checkPreviousRoute = (route) => {
    if (route.includes('/apps')) {
      return true;
    }
    return false;
  };

  componentDidUpdate(prevProps) {
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
  }

  switchDarkMode = (newMode) => {
    this.setState({ darkMode: newMode });
    useAppDataStore.getState().actions.updateIsTJDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  render() {
    const { updateAvailable, darkMode, isEditorOrViewer } = this.state;
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
    return (
      <>
        <div
          className={cx('main-wrapper', {
            'theme-dark dark-theme': !isEditorOrViewer && darkMode,
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
              {onboarding(this.props)}
              {auth(this.props)}
              <Route path="/sso/:origin/:configId" exact element={<Oauth {...this.props} />} />
              <Route path="/sso/:origin" exact element={<Oauth {...this.props} />} />
              <Route
                path="/invitations/:token/workspaces/:organizationToken"
                element={
                  <OrganizationInviteRoute {...this.props}>
                    <VerificationSuccessInfoScreen />
                  </OrganizationInviteRoute>
                }
              />
              <Route
                exact
                path="/:workspaceId/apps/:slug/:pageHandle?/*"
                element={
                  <AppsRoute componentType="editor">
                    <AppLoader
                      switchDarkMode={this.switchDarkMode}
                      darkMode={darkMode}
                      setEditorOrViewer={(value) => this.setState({ isEditorOrViewer: value })}
                    />
                  </AppsRoute>
                }
              />
              <Route
                exact
                path="/:workspaceId/workspace-constants"
                element={
                  <PrivateRoute>
                    <WorkspaceConstants switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                exact
                path="/applications/:slug/:pageHandle?"
                element={
                  <AppsRoute componentType="viewer">
                    <Viewer
                      switchDarkMode={this.switchDarkMode}
                      darkMode={this.props.isAppDarkMode}
                      setEditorOrViewer={(value) => this.setState({ isEditorOrViewer: value })}
                    />
                  </AppsRoute>
                }
              />
              <Route
                exact
                path="/applications/:slug/versions/:versionId/:pageHandle?"
                element={
                  <AppsRoute componentType="viewer">
                    <Viewer
                      switchDarkMode={this.switchDarkMode}
                      darkMode={this.props.isAppDarkMode}
                      setEditorOrViewer={(value) => this.setState({ isEditorOrViewer: value })}
                    />
                  </AppsRoute>
                }
              />
              <Route
                exact
                path="/oauth2/authorize"
                element={
                  <PrivateRoute>
                    <Authorize switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                exact
                path="/:workspaceId/workspace-settings"
                element={
                  <AdminRoute {...this.props}>
                    <OrganizationSettings switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </AdminRoute>
                }
              >
                <Route
                  path="users"
                  element={
                    <AdminRoute>
                      <ManageOrgUsers switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </AdminRoute>
                  }
                />
                <Route
                  path="workspace-login"
                  element={
                    <AdminRoute>
                      <OrganizationLogin switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </AdminRoute>
                  }
                />
                <Route
                  path="groups"
                  element={
                    <AdminRoute>
                      <ManageGroupPermissionsV2 switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </AdminRoute>
                  }
                />
                <Route
                  path="workspace-variables"
                  element={<ManageOrgVars switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
              </Route>
              <Route
                exact
                path="/:workspaceId/settings"
                element={
                  <PrivateRoute>
                    <SettingsPage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                exact
                path="/:workspaceId/data-sources"
                element={
                  <PrivateRoute>
                    <GlobalDatasources switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
              {window.public_config?.ENABLE_TOOLJET_DB == 'true' && (
                <Route
                  exact
                  path="/:workspaceId/database"
                  element={
                    <PrivateRoute>
                      <TooljetDatabase switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </PrivateRoute>
                  }
                />
              )}

              {window.public_config?.ENABLE_MARKETPLACE_FEATURE === 'true' && (
                <Route
                  exact
                  path="/integrations"
                  element={
                    <AdminRoute {...this.props}>
                      <MarketplacePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                    </AdminRoute>
                  }
                />
              )}
              <Route exact path="/" element={<Navigate to="/:workspaceId" />} />
              <Route
                exact
                path="/error/:errorType"
                element={<ErrorPage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
              />
              <Route
                exact
                path="/switch-workspace"
                element={
                  <SwitchWorkspaceRoute>
                    <SwitchWorkspacePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </SwitchWorkspaceRoute>
                }
              />
              <Route
                exact
                path="/:workspaceId"
                element={
                  <PrivateRoute>
                    <HomePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="*"
                render={() => {
                  if (authenticationService?.currentSessionValue?.current_organization_id) {
                    return <Navigate to="/:workspaceId" />;
                  }
                  return <Navigate to="/login" />;
                }}
              />
            </Routes>
          </BreadCrumbContext.Provider>
        </div>

        <Toast toastOptions={toastOptions} />
      </>
    );
  }
}

export const App = AppWrapper;
const AppWithRouter = withRouter(AppComponent);
