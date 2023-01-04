import React, { Suspense } from 'react';
// eslint-disable-next-line no-unused-vars
import config from 'config';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';
import { history } from '@/_helpers';
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

  componentDidMount() {
    authenticationService.currentUser.subscribe((x) => {
      this.setState({ currentUser: x }, this.fetchMetadata);
      setInterval(this.fetchMetadata, 1000 * 60 * 60 * 1);
    });
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
          <div className={`main-wrapper ${darkMode ? 'theme-dark' : ''}`}>
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
              path="/workspace-settings"
              component={OrganizationSettings}
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
            {window.public_config?.ENABLE_TOOLJET_DB == 'true' && (
              <PrivateRoute
                exact
                path="/database"
                component={TooljetDatabase}
                switchDarkMode={this.switchDarkMode}
                darkMode={darkMode}
              />
            )}
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
        <Toast toastOptions={toastOptions} />
      </Suspense>
    );
  }
}

export { App };
