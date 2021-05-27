import React from 'react';
import { Router, Route } from 'react-router-dom';
import { history } from '@/_helpers';
import { authenticationService } from '@/_services';
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

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: null
    };
  }

  componentDidMount() {
    authenticationService.currentUser.subscribe((x) => this.setState({ currentUser: x }));
  }

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  }

  render() {
    const { currentUser } = this.state;
    return (
      <Router history={history}>
        <div>
          {currentUser && <div></div>}

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
