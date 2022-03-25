import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { validateEmail } from '../_helpers/utils';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showPassword: false,
      isGettingConfigs: true,
      configs: undefined,
    };
    this.single_organization = window.public_config?.MULTI_ORGANIZATION !== 'true';
  }

  componentDidMount() {
    if (
      (!this.props.match.params.organisationId && authenticationService.currentUserValue) ||
      (this.props.match.params.organisationId &&
        authenticationService?.currentUserValue?.organization_id === this.props.match.params.organisationId)
    ) {
      // redirect to home if already logged in
      return this.props.history.push('/');
    }
    if (this.props.match.params.organisationId || this.single_organization) {
      authenticationService.getOrganizationConfigs(this.props.match.params.organisationId).then(
        (configs) => {
          if (!configs) {
            return this.props.history.push('/');
          }
          this.setState({ isGettingConfigs: false, configs });
        },
        () => this.props.history.push({ pathname: '/', state: { errorMessage: 'Error while login, please try again' } })
      );
    } else {
      // Not single organization login page and not an organization login page => Multi organization common login page
      // Only form login is allowed
      this.setState({
        isGettingConfigs: false,
        configs: {
          form: {
            enable_sign_up: window.public_config?.DISABLE_SIGNUPS !== 'true',
            enabled: true,
          },
        },
      });
    }

    this.props.location?.state?.errorMessage &&
      toast.error(this.props.location.state.errorMessage, {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };

  authUser = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email, password } = this.state;

    if (!validateEmail(email) || !password || !password.trim()) {
      toast.error('Invalid email or password', {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
      this.setState({ isLoading: false });
      return;
    }

    authenticationService.login(email, password).then(this.authSuccessHandler, this.authFailureHandler);
  };

  authSuccessHandler = () => {
    const params = queryString.parse(this.props.location.search);
    const { from } = params.redirectTo ? { from: { pathname: params.redirectTo } } : { from: { pathname: '/' } };
    const redirectPath = from.pathname === '/login' ? '/' : from;
    this.props.history.push(redirectPath);
    this.setState({ isLoading: false });
  };

  authFailureHandler = (error) => {
    if (error?.error === 'idpiframe_initialization_failed') {
      //Error thrown by google on load
      return this.setState({ isLoading: false });
    }
    toast.error('Invalid email or password', {
      id: 'toast-login-auth-error',
      position: 'top-center',
    });
    this.setState({ isLoading: false });
  };

  showLoading = () => {
    return (
      <div className="card-body">
        <div className="skeleton-heading"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="mb-2"></div>
        <div className="skeleton-heading"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
      </div>
    );
  };

  render() {
    const { isLoading, configs, isGettingConfigs } = this.state;
    return (
      <div className="page page-center">
        <div className="container-tight py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="/assets/images/logo-color.svg" height="26" alt="" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            {isGettingConfigs ? (
              this.showLoading()
            ) : (
              <div className="card-body">
                {configs?.form?.enabled && (
                  <div>
                    <h2 className="card-title text-center mb-4">
                      Login to {this.single_organization ? 'your account' : configs?.name || 'your account'}
                    </h2>
                    <div className="mb-3">
                      <label className="form-label">Email address</label>
                      <input
                        onChange={this.handleChange}
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        data-testid="emailField"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">
                        Password
                        <span className="form-label-description">
                          <Link to={'/forgot-password'} tabIndex="-1">
                            Forgot password
                          </Link>
                        </span>
                      </label>
                      <div className="input-group input-group-flat">
                        <input
                          onChange={this.handleChange}
                          name="password"
                          type={this.state.showPassword ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Password"
                          autoComplete="off"
                          data-testid="passwordField"
                        />
                        <span className="input-group-text"></span>
                      </div>
                    </div>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="check-input"
                        name="check-input"
                        onChange={this.handleOnCheck}
                      />
                      <label className="form-check-label" htmlFor="check-input">
                        show password
                      </label>
                    </div>
                  </div>
                )}
                <div
                  className={`form-footer d-flex flex-column align-items-center ${
                    !configs?.form?.enabled ? 'mt-0' : ''
                  }`}
                >
                  {configs?.form?.enabled && (
                    <button
                      data-testid="loginButton"
                      className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`}
                      onClick={this.authUser}
                    >
                      Sign in
                    </button>
                  )}
                  {this.state.configs?.google?.enabled && (
                    <GoogleSSOLoginButton
                      authSuccessHandler={this.authSuccessHandler}
                      authFailureHandler={this.authFailureHandler}
                      configs={this.state.configs?.google?.configs}
                    />
                  )}
                  {this.state.configs?.git?.enabled && <GitSSOLoginButton configs={this.state.configs?.git?.configs} />}
                </div>
              </div>
            )}
          </form>
          {!this.props.match.params.organisationId &&
            ((this.single_organization && configs?.form?.enable && configs?.form?.enable_sign_up) ||
              (!this.single_organization && configs?.form?.enable_sign_up)) && (
              <div className="text-center text-secondary mt-3">
                Don&apos;t have account yet? &nbsp;
                <Link to={'/signup'} tabIndex="-1">
                  Sign up
                </Link>
              </div>
            )}
          {authenticationService?.currentUserValue?.organization && (
            <div className="text-center mt-3">
              back to <a href="/">{authenticationService?.currentUserValue?.organization}</a>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export { LoginPage };
