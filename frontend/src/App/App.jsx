import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import config from 'config';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { history } from '@/_helpers';
import { getWorkspaceIdFromURL, appendWorkspaceId, stripTrailingSlash } from '@/_helpers/utils';
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
    if (this.state.currentUser) {
      tooljetService.fetchMetaData().then((data) => {
        localStorage.setItem('currentVersion', data.installed_version);
        if (data.latest_version && lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
          this.setState({ updateAvailable: true });
        }
      });
    }
  };

  async componentDidMount() {
    authenticationService.currentUser.subscribe((currentUser) => {
      if (currentUser) {
        const { current_organization_id, current_organization_name, organization_id } = currentUser;
        // get the workspace id from the url or the current_organization_id from the current user obj
        const workspaceId = getWorkspaceIdFromURL() || current_organization_id || organization_id;
        this.updateCurrentOrgDetails({
          current_organization_id: workspaceId,
          current_organization_name,
        });
        this.authorizeUserAndHandleErrors(currentUser, workspaceId);
      }
    });
  }

  //TODO: fix and use separateSubpathIfExist() fn
  isThisWorkspaceLoginPage = () => {
    const subpath = window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : null;
    const pathname = location.pathname.replace(subpath, '');
    const pathnames = pathname.split('/').filter((path) => path !== '');
    return pathnames.length === 2 && pathnames.includes('login');
  };

  authorizeUserAndHandleErrors = (currentUser, workspaceId) => {
    if (workspaceId) {
      authenticationService
        .authorize()
        .then((data) => {
          organizationService.getOrganizations().then((response) => {
            const current_organization_name = response.organizations.find((org) => org.id === workspaceId)?.name;

            //update only the current user obj, avoiding infinite observable reload
            const currentUserDetails = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUserDetails.current_organization_id !== workspaceId) {
              const updatedUserDetails = Object.assign({}, currentUserDetails, {
                current_organization_id: workspaceId,
                current_organization_name,
              });
              localStorage.setItem('currentUser', JSON.stringify(updatedUserDetails));
            }

            // this will add the other details like permission and user previlliage details to the subject
            this.updateCurrentOrgDetails({
              ...data,
              current_organization_name,
              organizations: response.organizations,
            });

            this.setState({ currentUser }, this.fetchMetadata);
            setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);

            // if user is trying to load the workspace login page, then redirect to the dashboard
            if (this.isThisWorkspaceLoginPage())
              return (window.location = appendWorkspaceId(workspaceId, '/:workspaceId'));
          });
        })
        .catch((error) => {
          // change invalid or not authorized org id to previous one
          this.updateCurrentOrgDetails({
            current_organization_id: currentUser?.current_organization_id,
          });

          // if the auth token didn't contain workspace-id, try switch workspace fn
          if (error && error?.data?.statusCode === 401) {
            organizationService
              .switchOrganization(workspaceId)
              .then((data) => {
                authenticationService.updateCurrentUserDetails(data);
                if (this.isThisWorkspaceLoginPage())
                  return (window.location = appendWorkspaceId(workspaceId, '/:workspaceId'));
              })
              .catch(() => {
                const subpath = window?.public_config?.SUB_PATH
                  ? stripTrailingSlash(window?.public_config?.SUB_PATH)
                  : null;
                if (!this.isThisWorkspaceLoginPage())
                  return (window.location = `${subpath ?? ''}/login/${workspaceId}`);
              });
          } else if (error && error?.data?.statusCode === 404) {
            organizationService
              .getOrganizations()
              .then((response) => {
                const { current_organization_id } = authenticationService.currentOrgValue;
                const current_organization_name = response.organizations.find(
                  (org) => org.id === current_organization_id
                )?.name;

                this.updateCurrentOrgDetails({
                  current_organization_name,
                  organizations: response.organizations,
                });

                //TODO: redirect to org switching page
                const subpath = window?.public_config?.SUB_PATH
                  ? stripTrailingSlash(window?.public_config?.SUB_PATH)
                  : null;
                return (window.location = subpath ? `${subpath}${'/'}` : '/');
              })
              .catch(() => {
                authenticationService.logout();
              });
          } else {
            //TODO: switch workspace page / show current workspace-hompage
            const subpath = window?.public_config?.SUB_PATH
              ? stripTrailingSlash(window?.public_config?.SUB_PATH)
              : null;
            return (window.location = subpath ? `${subpath}${'/'}` : '/');
          }
        });
    } else {
      authenticationService?.logout();
    }
  };

  updateCurrentOrgDetails = (newOrgDetails) => {
    const currentOrgDetails = authenticationService.currentOrgValue;
    authenticationService.updateCurrentOrg({ ...currentOrgDetails, ...newOrgDetails });
  };

  logout = () => {
    authenticationService.logout();
    history.push('/login');
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

              <PrivateRoute
                exact
                path="/:workspaceId"
                component={HomePage}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
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
