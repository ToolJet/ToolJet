import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { authorizeWorkspace } from '@/_helpers/authorizeWorkspace';
import { authenticationService, tooljetService } from '@/_services';
import { withRouter } from '@/_hoc/withRouter';
import { PrivateRoute, AdminRoute } from '@/_components';
import { HomePage } from '@/HomePage';
import { LoginPage } from '@/LoginPage';
import { SignupPage } from '@/SignupPage';
import { TooljetDatabase } from '@/TooljetDatabase';
import { OrganizationInvitationPage } from '@/ConfirmationPage';
import { Authorize } from '@/Oauth2';
import { Authorize as Oauth } from '@/Oauth';
import { Viewer } from '@/Editor';
import { OrganizationSettings } from '@/OrganizationSettingsPage';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { ForgotPassword } from '@/ForgotPassword';
import { ResetPassword } from '@/ResetPassword';
import { MarketplacePage } from '@/MarketplacePage';
import SwitchWorkspacePage from '@/HomePage/SwitchWorkspacePage';
import { GlobalDatasources } from '@/GlobalDatasources';
import { lt } from 'semver';
import Toast from '@/_ui/Toast';
import { VerificationSuccessInfoScreen } from '@/SuccessInfoScreen';
import '@/_styles/theme.scss';
import { AppLoader } from '@/AppLoader';
import SetupScreenSelfHost from '../SuccessInfoScreen/SetupScreenSelfHost';
export const BreadCrumbContext = React.createContext({});
import 'react-tooltip/dist/react-tooltip.css';
import { getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import ErrorPage from '@/_components/ErrorComponents/ErrorPage';
import WorkspaceConstants from '@/WorkspaceConstants';
import { useAppDataStore } from '@/_stores/appDataStore';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import OrganizationLogin from '@/_components/OrganizationLogin/OrganizationLogin';
import { ManageOrgVars } from '@/ManageOrgVars';

const AppWrapper = (props) => {
  return (
    <Suspense fallback={null}>
      <BrowserRouter basename={window.public_config?.SUB_PATH || '/'}>
        <AppWithRouter props={props} />
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
    localStorage.setItem('darkMode', newMode);
  };

  render() {
    const { updateAvailable, darkMode } = this.state;

    let toastOptions = {
      style: {
        wordBreak: 'break-all',
      },
    };

    if (darkMode) {
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
        <div className={`main-wrapper ${darkMode ? 'theme-dark dark-theme' : ''}`} data-cy="main-wrapper">
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
              <Route path="/login/:organizationId" exact element={<LoginPage />} />
              <Route path="/login" exact element={<LoginPage />} />
              <Route path="/setup" exact element={<SetupScreenSelfHost {...this.props} darkMode={darkMode} />} />
              <Route path="/sso/:origin/:configId" exact element={<Oauth />} />
              <Route path="/sso/:origin" exact element={<Oauth />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/invitations/:token" element={<VerificationSuccessInfoScreen />} />
              <Route
                path="/invitations/:token/workspaces/:organizationToken"
                element={<VerificationSuccessInfoScreen />}
              />
              <Route path="/confirm" element={<VerificationSuccessInfoScreen />} />
              <Route
                path="/organization-invitations/:token"
                element={<OrganizationInvitationPage {...this.props} darkMode={darkMode} />}
              />
              <Route
                path="/confirm-invite"
                element={<OrganizationInvitationPage {...this.props} darkMode={darkMode} />}
              />
              <Route
                exact
                path="/:workspaceId/apps/:slug/:pageHandle?/*"
                element={
                  <PrivateRoute>
                    <AppLoader switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
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
                  <PrivateRoute>
                    <Viewer switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                exact
                path="/applications/:slug/versions/:versionId/:pageHandle?"
                element={
                  <PrivateRoute>
                    <Viewer switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
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
                  <PrivateRoute>
                    <OrganizationSettings switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
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
                      <ManageGroupPermissions switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
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
                    <AdminRoute>
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
                  <PrivateRoute>
                    <SwitchWorkspacePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
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
