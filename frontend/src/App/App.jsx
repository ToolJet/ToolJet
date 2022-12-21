import React, { Suspense } from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import { history } from '@/_helpers';
import { authenticationService, tooljetService } from '@/_services';
import { PrivateRoute, AdminRoute } from '@/_components';
import { HomePage } from '@/HomePage';
import { LoginPage } from '@/LoginPage';
import { SignupPage } from '@/SignupPage';
import { OrganizationInvitationPage } from '@/ConfirmationPage';
import { Authorize } from '@/Oauth2';
import { Authorize as Oauth } from '@/Oauth';
import { Viewer } from '@/Editor';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissionResources } from '@/ManageGroupPermissionResources';
import { AuditLogs } from '@/AuditLogs';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { ForgotPassword } from '@/ForgotPassword';
import { ResetPassword } from '@/ResetPassword';
import { MarketplacePage } from '@/MarketplacePage';
import { ManageSSO } from '@/ManageSSO';
import { ManageOrgVars } from '@/ManageOrgVars';
import { ManageAllUsers } from '@/ManageAllUsers';
import { ManageInstanceSettings } from '@/ManageInstanceSettings';
import { lt } from 'semver';
import Toast from '@/_ui/Toast';
import { VerificationSuccessInfoScreen } from '@/SuccessInfoScreen';
import '@/_styles/theme.scss';
import 'emoji-mart/css/emoji-mart.css';
import { retrieveWhiteLabelText } from '../_helpers/utils';
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
        'word-break': 'break-all',
      },
    };

    if (darkMode) {
      toastOptions = {
        className: 'toast-dark-mode',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          'word-break': 'break-all',
        },
      };
    }

    return (
      <Suspense fallback={null}>
        <BrowserRouter history={history} basename={window.public_config?.SUB_PATH || '/'}>
          <div className={`main-wrapper ${darkMode ? 'theme-dark' : ''}`}>
            {updateAvailable && (
              <div className="alert alert-info alert-dismissible" role="alert">
                <h3 className="mb-1">Update available</h3>
                <p>{`A new version of ${retrieveWhiteLabelText()} has been released.`}</p>
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

            <PrivateRoute
              exact
              path="/"
              component={HomePage}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <Route path="/login/:organizationId" exact component={LoginPage} />
            <Route path="/login" exact component={LoginPage} />
            <Route path="/setup" exact component={SetupScreenSelfHost} darkMode={darkMode} />
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
            <Route path="/confirm-invite" component={OrganizationInvitationPage} />
            <PrivateRoute
              exact
              path="/apps/:id/:pageHandle?"
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
              path="/users"
              component={ManageOrgUsers}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/all-users"
              component={ManageAllUsers}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/instance-settings"
              component={ManageInstanceSettings}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/manage-sso"
              component={ManageSSO}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/manage-environment-vars"
              component={ManageOrgVars}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/groups"
              component={ManageGroupPermissions}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/groups/:id"
              component={ManageGroupPermissionResources}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/audit-logs"
              component={AuditLogs}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/settings"
              component={SettingsPage}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            {window.public_config?.ENABLE_MARKETPLACE_FEATURE && (
              <AdminRoute
                exact
                path="/integrations"
                component={MarketplacePage}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
            )}
          </div>
        </BrowserRouter>
        <div id="modal-div"></div>
        <Toast toastOptions={toastOptions} />
      </Suspense>
    );
  }
}

export { App };
