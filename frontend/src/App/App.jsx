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
import { Editor, Viewer } from '@/Editor';
import '@/_styles/theme.scss';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ManageOrgUsers } from '@/ManageOrgUsers';
import { OnboardingModal } from '@/Onboarding/OnboardingModal';
import {ForgotPassword} from '@/ForgotPassword'
import { ResetPassword } from '@/ResetPassword';

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
    });
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

          <PrivateRoute exact path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path = "/forgot-password" component ={ForgotPassword} />
          <Route path = "/reset-password" component ={ResetPassword} />
          <Route path="/invitations/:token" component={InvitationPage} />
          <PrivateRoute exact path="/apps/:id" component={Editor} />
          <PrivateRoute exact path="/applications/:slug" component={Viewer} />
          <PrivateRoute exact path="/oauth2/authorize" component={Authorize} />
          <PrivateRoute exact path="/users" component={ManageOrgUsers} />
        </div>
      </Router>
    );
  }
}

export { App };
