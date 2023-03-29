import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import { withRouter } from '@/_hoc/withRouter';
import { authenticationService, tooljetService } from '@/_services';
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
import { AuditLogs } from '@/AuditLogs';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { ForgotPassword } from '@/ForgotPassword';
import { ResetPassword } from '@/ResetPassword';
import { MarketplacePage } from '@/MarketplacePage';
import { GlobalDatasources } from '@/GlobalDatasources';
import { lt } from 'semver';
import Toast from '@/_ui/Toast';
import { VerificationSuccessInfoScreen } from '@/SuccessInfoScreen';
import '@/_styles/theme.scss';
import { retrieveWhiteLabelText } from '../_helpers/utils';
import { AppLoader } from '@/AppLoader';
import SetupScreenSelfHost from '../SuccessInfoScreen/SetupScreenSelfHost';
import { InstanceSettings } from '@/InstanceSettingsPage';

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

  fetchMetadata = () => {
    if (this.state.currentUser) {
      tooljetService.fetchMetaData().then((data) => {
        localStorage.setItem('currentVersion', data.installed_version);
        if (data.latest_version && lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
          this.setState({ updateAvailable: true });
        }
      });
    }
  };

  setFaviconAndTitle() {
    const favicon_url = window.public_config?.WHITE_LABEL_FAVICON;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = favicon_url ? favicon_url : 'assets/images/logo.svg';
    document.title = `${retrieveWhiteLabelText()} - Dashboard`;
  }

  componentDidMount() {
    authenticationService.currentUser.subscribe((x) => {
      this.setState({ currentUser: x }, this.fetchMetadata);
      setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);
    });
    this.setFaviconAndTitle();
  }

  switchDarkMode = (newMode) => {
    this.setState({ darkMode: newMode });
    localStorage.setItem('darkMode', newMode);
  };

  render() {
    const { updateAvailable, darkMode, currentUser } = this.state;
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
          <Routes>
            <Route
              exact
              path="*"
              element={
                <PrivateRoute>
                  <HomePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            />
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
              path="/apps/:id/:pageHandle?/*"
              element={
                <PrivateRoute>
                  <AppLoader switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            />
            <Route
              exact
              path="/applications/:id/versions/:versionId/environments/:environmentId/:pageHandle?"
              component={Viewer}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
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
              path="/oauth2/authorize"
              element={
                <PrivateRoute>
                  <Authorize switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            />
            <Route
              exact
              path="/workspace-settings"
              element={
                <PrivateRoute>
                  <OrganizationSettings switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            />
            <Route
              exact
              path="/instance-settings"
              component={InstanceSettings}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            {/* <PrivateRoute
              exact
              path="/audit-logs"
              component={AuditLogs}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            /> */}
            {/* <PrivateRoute
              exact
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            /> */}
            {window.public_config?.ENABLE_TOOLJET_DB == 'true' && (
              <Route
                exact
                path="/database"
                element={
                  <PrivateRoute>
                    <TooljetDatabase switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
            )}
            <Route
              exact
              path="/global-datasources"
              element={
                <PrivateRoute>
                  <GlobalDatasources switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                </PrivateRoute>
              }
            />
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
          </Routes>
          <div id="modal-div"></div>
        </div>
        <Toast toastOptions={toastOptions} />
      </>
    );
  }
}

export const App = AppWrapper;
const AppWithRouter = withRouter(AppComponent);
