import React from 'react';
import config from 'config';
import { Router, Route } from 'react-router-dom';
import { history } from '@/_helpers';
import { authenticationService, tooljetService } from '@/_services';
import { PrivateRoute } from '@/_components';
import { HomePage, Library } from '@/HomePage';
import { LoginPage } from '@/LoginPage';
import { SignupPage } from '@/SignupPage';
import { InvitationPage } from '@/InvitationPage';
import { Authorize } from '@/Oauth2';
import { Editor, Viewer } from '@/Editor';
import '@/_styles/theme.scss';
import 'emoji-mart/css/emoji-mart.css';
import { ManageGroupPermissions } from '@/ManageGroupPermissions';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { ManageGroupPermissionResources } from '@/ManageGroupPermissionResources';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { OnboardingModal } from '@/Onboarding/OnboardingModal';
import { ForgotPassword } from '@/ForgotPassword';
import { ResetPassword } from '@/ResetPassword';
import { lt } from 'semver';
import { Toaster, toast } from 'react-hot-toast';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      socket: null,
      fetchedMetadata: false,
      onboarded: true,
      darkMode: localStorage.getItem('darkMode') === 'true',
    };
  }

  componentDidMount() {
    authenticationService.currentUser.subscribe((currentUser) => {
      this.setState({ currentUser });
      this.initWebSocket(currentUser);
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

  getWebsocketUrl = () => {
    const re = /https?:\/\//g;
    if (re.test(config.apiUrl)) return config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '');

    return window.location.host;
  };

  initWebSocket = (currentUser) => {
    // TODO: add retry policy
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${this.getWebsocketUrl()}`);

    // Connection opened
    socket.addEventListener('open', function (event) {
      console.log('connection established', event);

      socket.send(
        JSON.stringify({
          event: 'authenticate',
          data: {
            authToken: currentUser.auth_token,
            userId: currentUser.id,
            organizationId: currentUser.organization_id,
          },
        })
      );
    });

    socket.addEventListener('message', function (event) {
      const data = JSON.parse(event.data);

      if (data.message === 'force-logout') {
        toast.error(data.toast);
        authenticationService.logout();
        history.push('/login');
      }
    });

    // Connection closed
    socket.addEventListener('close', function (event) {
      console.log('connection closed', event);
    });

    // Listen for possible errors
    socket.addEventListener('error', function (event) {
      console.log('WebSocket error: ', event);
    });

    this.setState({
      socket,
    });
  };

  render() {
    const { currentUser, fetchedMetadata, updateAvailable, onboarded, darkMode, socket } = this.state;
    let toastOptions = {};

    if (darkMode) {
      toastOptions = {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      };
    }

    if (currentUser && fetchedMetadata === false) {
      tooljetService.fetchMetaData().then((data) => {
        this.setState({ fetchedMetadata: true, onboarded: data.onboarded });

        if (lt(data.installed_version, data.latest_version) && data.version_ignored === false) {
          this.setState({ updateAvailable: true });
        }
      });
    }

    return (
      <>
        <Router history={history}>
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

            {!onboarded && <OnboardingModal />}

            <PrivateRoute
              exact
              path="/"
              component={HomePage}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <Route path="/login" component={LoginPage} socket={socket} initWebSocket={this.initWebSocket} />
            <Route path="/signup" component={SignupPage} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/invitations/:token" component={InvitationPage} />
            <PrivateRoute
              exact
              path="/apps/:id"
              component={Editor}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
              socket={socket}
            />
            <PrivateRoute
              exact
              path="/applications/:id/versions/:versionId"
              component={Viewer}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
            />
            <PrivateRoute
              exact
              path="/applications/:slug"
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
              socket={socket}
            />
            <PrivateRoute
              exact
              path="/users"
              component={ManageOrgUsers}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
              socket={socket}
            />
            <PrivateRoute
              exact
              path="/groups"
              component={ManageGroupPermissions}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
              socket={socket}
            />
            <PrivateRoute
              exact
              path="/groups/:id"
              component={ManageGroupPermissionResources}
              switchDarkMode={this.switchDarkMode}
              darkMode={darkMode}
              socket={socket}
            />
            <PrivateRoute
              exact
              path="/library"
              component={Library}
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
          </div>
        </Router>
        <Toaster toastOptions={toastOptions} />
      </>
    );
  }
}

export { App };
