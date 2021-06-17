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

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null,
      fetchedMetadata: false,
      onboarded: true
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
      posthog.capture('my event', { property: 'value' });
    });

    window.chatwootSettings = {
      hideMessageBubble: true,
    }
  }

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  }

  render() {
    const { currentUser, fetchedMetadata, updateAvailable, onboarded } = this.state;

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
        <div>
          {updateAvailable && <div class="alert alert-info alert-dismissible" role="alert">
            <h3 class="mb-1">Update available</h3>
            <p>A new version of ToolJet has been released.</p>
            <div class="btn-list">
              <a href="https://docs.tooljet.io/docs/setup/updating" target="_blank" class="btn btn-info">Read release notes & update</a>
              <a onClick={() => { tooljetService.skipVersion(); this.setState({ updateAvailable: false }); }} class="btn">Skip this version</a>
            </div>
          </div>}

          {!onboarded && 
            <OnboardingModal />
          }

          <ToastContainer />

          <PrivateRoute exact path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/invitations/:token" component={InvitationPage} />
          <PrivateRoute exact path="/apps/:id" component={Editor} />
          <PrivateRoute exact path="/applications/:id" component={Viewer} />
          <PrivateRoute exact path="/oauth2/authorize" component={Authorize} />
          <PrivateRoute exact path="/users" component={ManageOrgUsers} />
          <PrivateRoute exact path="/library" component={Library} />
        </div>
      </Router>
    );
  }
}

export { App };
