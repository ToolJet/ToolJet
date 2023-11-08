import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { authorizeWorkspace, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { retrieveWhiteLabelText } from '@/_helpers/utils';
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
import { AuditLogsPage } from '@/AuditLogs';
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
import { InstanceSettings } from '@/InstanceSettingsPage';
import initPosthog from '../_helpers/initPosthog';
import { ManageAllUsers } from '@/ManageAllUsers';
import { ManageInstanceSettings, ManageWhiteLabelling } from '@/ManageInstanceSettings';
import { ManageLicenseKey } from '@/ManageLicenseKey';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageSSO } from '@/ManageSSO';
import { ManageOrgVars } from '@/ManageOrgVars';
import { CopilotSetting } from '@/CopilotSettings';
import { CustomStylesEditor } from '@/CustomStylesEditor';
import { ManageOrgConstants } from '@/ManageOrgConstants';
export const BreadCrumbContext = React.createContext({});
import 'react-tooltip/dist/react-tooltip.css';
import LdapLoginPage from '../LdapLogin';
import { getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import ErrorPage from '@/_components/ErrorComponents/ErrorPage';

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
      updateCurrentSession({
        instance_id: data?.instance_id,
      });
      localStorage.setItem('currentVersion', data.installed_version);
      if (data.latest_version && lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
        this.setState({ updateAvailable: true });
      }
    });
  };

  setFaviconAndTitle() {
    const favicon_url = window.public_config?.WHITE_LABEL_FAVICON;
    let links = document.querySelectorAll("link[rel='icon']");
    links.forEach((link) => {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = favicon_url ? favicon_url : 'assets/images/logo.svg';
    });
    document.title = `${retrieveWhiteLabelText()} - Dashboard`;
  }

  initTelemetryAndSupport(currentUser) {
    const isApplicationsPath = window.location.pathname.includes('/applications/');
    function initFreshChat() {
      window.fcWidget.init({
        token: '0ef214a3-8ae1-41fb-b0d0-57764bf8f64b',
        host: 'https://wchat.freshchat.com',
        config: {
          cssNames: {
            widget: 'custom_fc_frame',
          },
          content: {
            actions: {
              push_notify_yes: 'Yes',
            },
          },
          headerProperty: {
            hideChatButton: true,
            direction: 'rtl',
          },
        },
      });

      window.fcWidget.user.setFirstName(`${currentUser.first_name} ${currentUser.last_name}`);

      window.fcWidget.user.setEmail(currentUser.email);
    }
    function initialize(i, t) {
      var e;
      i.getElementById(t)
        ? initFreshChat()
        : (((e = i.createElement('script')).id = t),
          (e.async = !0),
          (e.src = 'https://wchat.freshchat.com/js/widget.js'),
          (e.onload = initFreshChat),
          i.head.appendChild(e));
    }
    function initiateCall() {
      initialize(document, 'Freshdesk Messaging-js-sdk');
    }

    if (!isApplicationsPath) {
      //freshchat needed only in editor mode and not in viwermode
      window.addEventListener
        ? window.addEventListener('load', initiateCall, !1)
        : window.attachEvent('load', initiateCall, !1);

      try {
        initiateCall();
      } catch (e) {
        console.log(e);
      }
    }
    initPosthog(currentUser);
  }

  componentDidMount() {
    this.setFaviconAndTitle();
    authorizeWorkspace();
    this.fetchMetadata();
    // setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);
    this.counter = 0;
    this.interval = setInterval(() => {
      ++this.counter;
      const current_user = authenticationService.currentSessionValue?.current_user;
      if (current_user?.id) {
        this.initTelemetryAndSupport(current_user);
        clearInterval(this.interval);
      } else if (this.counter > 10) {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
              <Route path="/ldap/:organizationId" element={<LdapLoginPage {...this.props} darkMode={darkMode} />} />
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
                  element={<ManageOrgUsers switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route
                  path="groups"
                  element={<ManageGroupPermissions switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route path="sso" element={<ManageSSO switchDarkMode={this.switchDarkMode} darkMode={darkMode} />} />
                <Route
                  path="workspace-variables"
                  element={<ManageOrgVars switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route
                  path="workspace-constants"
                  element={<ManageOrgConstants switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route
                  path="copilot"
                  element={<CopilotSetting />}
                  switchDarkMode={this.switchDarkMode}
                  darkMode={darkMode}
                />
                <Route
                  path="custom-styles"
                  element={<CustomStylesEditor switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
              </Route>
              <Route
                exact
                path="/instance-settings"
                element={
                  <PrivateRoute>
                    <InstanceSettings switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              >
                <Route
                  path="all-users"
                  element={<ManageAllUsers switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route
                  path="manage-instance-settings"
                  element={<ManageInstanceSettings switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route
                  path="white-labelling"
                  element={<ManageWhiteLabelling switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
                <Route
                  path="license"
                  element={<ManageLicenseKey switchDarkMode={this.switchDarkMode} darkMode={darkMode} />}
                />
              </Route>
              <Route
                exact
                path="/:workspaceId/audit-logs"
                element={
                  <PrivateRoute>
                    <AuditLogsPage switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
                  </PrivateRoute>
                }
              />
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
              <Route
                exact
                path="/applications/:id/versions/:versionId/:pageHandle?"
                element={
                  <PrivateRoute>
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
                    <HomePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} appType={'front-end'} />
                  </PrivateRoute>
                }
              />
              {window.public_config?.ENABLE_WORKFLOWS_FEATURE === 'true' && (
                <Route
                  exact
                  path="/:workspaceId/workflows"
                  element={
                    <AdminRoute>
                      <HomePage switchDarkMode={this.switchDarkMode} darkMode={darkMode} appType={'workflow'} />
                    </AdminRoute>
                  }
                />
              )}
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
          <div id="modal-div"></div>
        </div>

        <Toast toastOptions={toastOptions} />
      </>
    );
  }
}

export const App = AppWrapper;
const AppWithRouter = withRouter(AppComponent);
