import React from 'react';
import { Router, Route } from 'react-router-dom';
import { history } from '@/_helpers';
import { authenticationService, tooljetService } from '@/_services';
import { PrivateRoute } from '@/_components';
import { HomePage } from '@/HomePage';
import { LoginPage } from '@/LoginPage';
import { SignupPage } from '@/SignupPage';
import { InvitationPage } from '@/InvitationPage';
import { Authorize } from '@/Oauth2';
import { Authorize as Oauth } from '@/Oauth';
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
import { Toaster } from 'react-hot-toast';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      fetchedMetadata: false,
      onboarded: true,
      darkMode: localStorage.getItem('darkMode') === 'true',
    };
  }

  componentDidMount() {
    authenticationService.currentUser.subscribe((x) => {
      this.setState({ currentUser: x });
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
    const { currentUser, fetchedMetadata, updateAvailable, onboarded, darkMode } = this.state;
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
            <Route path="/login" component={LoginPage} />
            <Route path="/sso/:origin" component={Oauth} />
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
