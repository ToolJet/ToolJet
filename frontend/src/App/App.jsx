import React from 'react';
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { OnboardingModal } from '@/Onboarding/OnboardingModal';
import posthog from 'posthog-js';
import {ForgotPassword} from '@/ForgotPassword'
import { ResetPassword } from '@/ResetPassword';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      fetchedMetadata: false,
      onboarded: true,
      darkMode: localStorage.getItem('darkMode') === 'true'
    };
  }

  componentDidMount() {
    authenticationService.currentUser.subscribe((x) => {
      this.setState({ currentUser: x });
      window.addEventListener('chatwoot:ready', function () {
        try {
          window.$chatwoot.setUser(x.email, {
            email: x.email,
            name: `${x.first_name} ${x.last_name}`,
          });
        } catch (error) {
          console.error(error);
        }
      });

      posthog.init('1OhSAF2367nMhuGI3cLvE6m5D0PJPBEA5zR5JFTM-yw', { api_host: 'https://app.posthog.com' });
      posthog.identify(
        x.email, // distinct_id, required
        { name: `${x.first_name} ${x.last_name}` },
      );
    });

    window.chatwootSettings = {
      hideMessageBubble: true,
    }
  }

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  }

  switchDarkMode = (newMode) => {
    this.setState({ darkMode: newMode });
    localStorage.setItem('darkMode', newMode);
  }

  render() {
    const { currentUser, fetchedMetadata, updateAvailable, onboarded, darkMode } = this.state;

    if(currentUser && fetchedMetadata === false) {
      tooljetService.fetchMetaData().then((data) => {
        this.setState({ fetchedMetadata: true, onboarded: data.onboarded });

        if(data.installed_version < data.latest_version && data.version_ignored === false) {
          this.setState({ updateAvailable: true });
        }
      })
    }

    return (
      <Router history={history}>
        <div className={`main-wrapper ${darkMode ? 'theme-dark' : ''}`}>
          {updateAvailable && <div className="alert alert-info alert-dismissible" role="alert">
            <h3 className="mb-1">Update available</h3>
            <p>A new version of ToolJet has been released.</p>
            <div className="btn-list">
              <a href="https://docs.tooljet.io/docs/setup/updating" target="_blank" className="btn btn-info">Read release notes & update</a>
              <a onClick={() => { tooljetService.skipVersion(); this.setState({ updateAvailable: false }); }} className="btn">Skip this version</a>
            </div>
          </div>}

          {!onboarded &&
            <OnboardingModal />
          }

          <ToastContainer />

          <PrivateRoute exact path="/" component={HomePage} switchDarkMode={this.switchDarkMode} darkMode={darkMode}/>
          <Route path="/login" component={LoginPage}/>
          <Route path="/signup" component={SignupPage} />
          <Route path = "/forgot-password" component ={ForgotPassword} />
          <Route path = "/reset-password" component ={ResetPassword} />
          <Route path="/invitations/:token" component={InvitationPage} />
          <PrivateRoute exact path="/apps/:id" component={Editor} switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
          <PrivateRoute exact path="/applications/:slug" component={Viewer} switchDarkMode={this.switchDarkMode} darkMode={darkMode}/>
          <PrivateRoute exact path="/oauth2/authorize" component={Authorize} switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
          <PrivateRoute exact path="/users" component={ManageOrgUsers} switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
          <PrivateRoute exact path="/library" component={Library} switchDarkMode={this.switchDarkMode} darkMode={darkMode} />
        </div>
      </Router>
    );
  }
}

export { App };
