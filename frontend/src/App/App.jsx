import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import config from 'config';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { history } from '@/_helpers';
import { getWorkspaceIdFromURL, appendWorkspaceId, stripTrailingSlash, getSubpath } from '@/_helpers/utils';
import { authenticationService, tooljetService, organizationService } from '@/_services';
import { PrivateRoute } from '@/_components';
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
import { lt } from 'semver';
import Toast from '@/_ui/Toast';
import { VerificationSuccessInfoScreen } from '@/SuccessInfoScreen';
import '@/_styles/theme.scss';
import 'emoji-mart/css/emoji-mart.css';
import { AppLoader } from '@/AppLoader';
import SetupScreenSelfHost from '../SuccessInfoScreen/SetupScreenSelfHost';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      fetchedMetadata: false,
      darkMode: localStorage.getItem('darkMode') === 'true',
    };
  }

  fetchMetadata = () => {
    tooljetService.fetchMetaData().then((data) => {
      localStorage.setItem('currentVersion', data.installed_version);
      if (data.latest_version && lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
        this.setState({ updateAvailable: true });
      }
    });
  };

  isThisExistedRoute = () => {
    const existedPaths = [
      'forgot-password',
      'reset-password',
      'invitations',
      'organization-invitations',
      'sso',
      'setup',
      'confirm',
      'confirm-invite',
    ];
    return existedPaths.find((path) => window.location.pathname.includes(path));
  };

  componentDidMount() {
    if (!this.isThisExistedRoute()) {
      const workspaceId = getWorkspaceIdFromURL();
      if (workspaceId) {
        this.authorizeUserAndHandleErrors(workspaceId);
      } else {
        authenticationService
          .validateSession()
          .then(({ current_organization_id }) => {
            //check if the page is not switch-workspace, if then redirect to the page
            if (window.location.pathname !== `${getSubpath() ?? ''}/switch-workspace`) {
              this.authorizeUserAndHandleErrors(current_organization_id);
            } else {
              this.updateCurrentSession({
                current_organization_id,
              });
            }
          })
          .catch(() => {
            if (!this.isThisWorkspaceLoginPage(true) && !window.location.pathname.includes('applications')) {
              // window.location = `${getSubpath() ?? ''}/login`;
              this.updateCurrentSession({
                authentication_status: false,
              });
            } else if (window.location.pathname.includes('applications')) {
              this.updateCurrentSession({
                authentication_failed: true,
              });
            }
          });
      }
    }

    this.fetchMetadata();
    setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);
  }

  isThisWorkspaceLoginPage = (justLoginPage = false) => {
    const subpath = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : null;
    const pathname = location.pathname.replace(subpath, '');
    const pathnames = pathname.split('/').filter((path) => path !== '');
    return (justLoginPage && pathnames.includes('login')) || (pathnames.length === 2 && pathnames.includes('login'));
  };

  authorizeUserAndHandleErrors = (workspaceId) => {
    const subpath = getSubpath();
    this.updateCurrentSession({
      current_organization_id: workspaceId,
    });
    authenticationService
      .authorize()
      .then((data) => {
        organizationService.getOrganizations().then((response) => {
          const current_organization_name = response.organizations.find((org) => org.id === workspaceId)?.name;
          // this will add the other details like permission and user previlliage details to the subject
          this.updateCurrentSession({
            ...data,
            current_organization_name,
            organizations: response.organizations,
          });

          // if user is trying to load the workspace login page, then redirect to the dashboard
          if (this.isThisWorkspaceLoginPage())
            return (window.location = appendWorkspaceId(workspaceId, '/:workspaceId'));
        });
      })
      .catch((error) => {
        // if the auth token didn't contain workspace-id, try switch workspace fn
        if (error && error?.data?.statusCode === 401) {
          //get current session workspace id
          authenticationService
            .validateSession()
            .then(({ current_organization_id }) => {
              // change invalid or not authorized org id to previous one
              this.updateCurrentSession({
                current_organization_id,
              });

              organizationService
                .switchOrganization(workspaceId)
                .then((data) => {
                  this.updateCurrentSession(data);
                  if (this.isThisWorkspaceLoginPage())
                    return (window.location = appendWorkspaceId(workspaceId, '/:workspaceId'));
                  this.authorizeUserAndHandleErrors(workspaceId);
                })
                .catch(() => {
                  if (!this.isThisWorkspaceLoginPage())
                    return (window.location = `${subpath ?? ''}/login/${workspaceId}`);
                });
            })
            .catch(() => this.logout());
        } else if ((error && error?.data?.statusCode == 422) || error?.data?.statusCode == 404) {
          window.location = subpath ? `${subpath}${'/switch-workspace'}` : '/switch-workspace';
        } else {
          if (!this.isThisWorkspaceLoginPage() && !this.isThisWorkspaceLoginPage(true))
            this.updateCurrentSession({
              authentication_status: false,
            });
        }
      });
  };

  updateCurrentSession = (newSession) => {
    const currentSession = authenticationService.currentSessionValue;
    authenticationService.updateCurrentSession({ ...currentSession, ...newSession });
  };

  logout = () => {
    authenticationService.logout();
  };

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

    return (
      <Suspense fallback={null}>
        <BrowserRouter history={history} basename={window.public_config?.SUB_PATH || '/'}>
          <div className={`main-wrapper ${darkMode ? 'theme-dark' : ''}`} data-cy="main-wrapper">
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

            <Switch>
              {/* https://www.app.tooljet.com route will be redirected to https://www.app.tooljet.com/<workspace-id> */}

              <Route path="/login/:organizationId" exact component={LoginPage} />
              <Route path="/login" exact component={LoginPage} />
              <Route
                path="/setup"
                exact
                component={(props) => <SetupScreenSelfHost {...props} darkMode={darkMode} />}
              />
              <Route path="/sso/:origin/:configId" exact component={Oauth} />
              <Route path="/sso/:origin" exact component={Oauth} />
              <Route path="/signup" component={SignupPage} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route
                path="/reset-password/:token"
                render={(props) => (
                  <Redirect
                    to={{
                      pathname: '/reset-password',
                      state: {
                        token: props.match.params.token,
                      },
                    }}
                  />
                )}
              />
              <Route path="/reset-password" component={ResetPassword} />
              <Route
                exact
                path="/invitations/:token"
                render={(props) => (
                  <Redirect
                    to={{
                      pathname: '/confirm',
                      state: {
                        token: props.match.params.token,
                        search: props.location.search,
                      },
                    }}
                  />
                )}
              />
              <Route
                path="/invitations/:token/workspaces/:organizationToken"
                render={(props) => (
                  <Redirect
                    to={{
                      pathname: '/confirm',
                      state: {
                        token: props.match.params.token,
                        organizationToken: props.match.params.organizationToken,
                        search: props.location.search,
                      },
                    }}
                  />
                )}
              />
              <Route path="/confirm" component={VerificationSuccessInfoScreen} />
              <Route
                path="/organization-invitations/:token"
                render={(props) => (
                  <Redirect
                    to={{
                      pathname: '/confirm-invite',
                      state: {
                        token: props.match.params.token,
                        search: props.location.search,
                      },
                    }}
                  />
                )}
              />
              <Route
                path="/confirm-invite"
                component={(props) => <OrganizationInvitationPage {...props} darkMode={darkMode} />}
              />
              <PrivateRoute
                exact
                path="/:workspaceId/apps/:id/:pageHandle?"
                component={AppLoader}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
              <PrivateRoute
                exact
                path="/applications/:id/versions/:versionId/:pageHandle?"
                component={Viewer}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
              <PrivateRoute
                exact
                path="/applications/:slug/:pageHandle?"
                component={Viewer}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
              <PrivateRoute
                exact
                path="/oauth2/authorize"
                component={Authorize}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
              <PrivateRoute
                exact
                path="/:workspaceId/workspace-settings"
                component={OrganizationSettings}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
              <PrivateRoute
                exact
                path="/:workspaceId/settings"
                component={SettingsPage}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
              {window.public_config?.ENABLE_TOOLJET_DB == 'true' && (
                <PrivateRoute
                  exact
                  path="/:workspaceId/database"
                  component={TooljetDatabase}
                  switchDarkMode={this.switchDarkMode}
                  darkMode={darkMode}
                />
              )}
              {window.public_config?.ENABLE_MARKETPLACE_FEATURE && (
                <PrivateRoute
                  exact
                  path="/:workspaceId/integrations"
                  component={MarketplacePage}
                  switchDarkMode={this.switchDarkMode}
                  darkMode={darkMode}
                  isAdminRoute={true}
                />
              )}

              <Route
                path="/"
                exact
                render={() => {
                  return <Redirect to="/:workspaceId" />;
                }}
              />

              <PrivateRoute exact path="/switch-workspace" component={SwitchWorkspacePage} darkMode={darkMode} />

              <PrivateRoute
                exact
                path="/:workspaceId"
                component={HomePage}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />

              <Route
                path="*"
                render={() => {
                  if (authenticationService?.currentSessionValue?.current_organization_id) {
                    return <Redirect to="/:workspaceId" />;
                  }
                  return <Redirect to="/login" />;
                }}
              />
            </Switch>
          </div>
        </BrowserRouter>
        <Toast toastOptions={toastOptions} />
      </Suspense>
    );
  }
}

export { App };
