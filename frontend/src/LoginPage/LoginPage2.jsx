import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { validateEmail } from '../_helpers/utils';
import { ShowLoading } from '@/_components';
class LoginPage2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showPassword: false,
      isGettingConfigs: true,
      configs: undefined,
    };
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
    this.organizationId = props.match.params.organizationId;
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();
    if (
      (!this.organizationId && authenticationService.currentUserValue) ||
      (this.organizationId && authenticationService?.currentUserValue?.organization_id === this.organizationId)
    ) {
      // redirect to home if already logged in
      return this.props.history.push('/');
    }
    if (this.organizationId || this.single_organization) {
      authenticationService.saveLoginOrganizationId(this.organizationId);
      authenticationService.getOrganizationConfigs(this.organizationId).then(
        (configs) => {
          this.setState({ isGettingConfigs: false, configs });
        },
        (response) => {
          if (response.data.statusCode !== 404) {
            return this.props.history.push({
              pathname: '/',
              state: { errorMessage: 'Error while login, please try again' },
            });
          }
          // If there is no organization found for single organization setup
          // show form to sign up
          this.setState({
            isGettingConfigs: false,
            configs: {
              form: {
                enable_sign_up: true,
                enabled: true,
              },
            },
          });
        }
      );
    } else {
      // Not single organization login page and not an organization login page => Multi organization common login page
      // Only password and instance SSO login is allowed
      this.setState({
        isGettingConfigs: false,
        configs: {
          google: {
            enabled: !!window.public_config?.SSO_GOOGLE_OAUTH2_CLIENT_ID,
            configs: {
              client_id: window.public_config?.SSO_GOOGLE_OAUTH2_CLIENT_ID,
            },
          },
          git: {
            enabled: !!window.public_config?.SSO_GIT_OAUTH2_CLIENT_ID,
            configs: {
              client_id: window.public_config?.SSO_GIT_OAUTH2_CLIENT_ID,
              host_name: window.public_config?.SSO_GIT_OAUTH2_HOST,
            },
          },
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

    authenticationService
      .login(email, password, this.organizationId)
      .then(this.authSuccessHandler, this.authFailureHandler);
  };

  authSuccessHandler = () => {
    authenticationService.deleteLoginOrganizationId();
    const params = queryString.parse(this.props.location.search);
    const { from } = params.redirectTo ? { from: { pathname: params.redirectTo } } : { from: { pathname: '/' } };
    const redirectPath = from.pathname === '/login' ? '/' : from;
    this.props.history.push(redirectPath);
    this.setState({ isLoading: false });
  };

  authFailureHandler = (res) => {
    toast.error(res.error || 'Invalid email or password', {
      id: 'toast-login-auth-error',
      position: 'top-center',
    });
    this.setState({ isLoading: false });
  };

  render() {
    const { isLoading, configs, isGettingConfigs } = this.state;
    return (
      <>
        <div className="common-auth-section-whole-wrapper page">
          <div className="common-auth-section-left-wrapper">
            <div className="onboarding-navbar container-xl">
              <img src="assets/images/logo-color.svg" height="17.5" alt="" data-cy="page-logo" />
            </div>

            <div className="common-auth-section-left-wrapper-grid">
              <div></div>
              <form className="" action="." method="get" autoComplete="off">
                {isGettingConfigs ? (
                  <ShowLoading />
                ) : (
                  <div className="common-auth-container-wrapper ">
                    {!configs && <div className="text-center">No login methods enabled for this workspace</div>}
                    {configs?.form?.enabled && (
                      <div>
                        <h2 className="common-auth-section-header">Sign in</h2>
                        <div className="common-auth-sub-label">
                          {/* Login to {this.single_organization ? 'your account' : configs?.name || 'your account'} */}
                          {!this.organizationId && configs?.form?.enabled && configs?.form?.enable_sign_up && (
                            <div className="common-sub-header">
                              New to toolJet?
                              <Link to={'/signup'} tabIndex="-1" style={{ marginLeft: '4px' }}>
                                Create an account
                              </Link>
                            </div>
                          )}
                        </div>
                        {this.state.configs?.git?.enabled && (
                          <div className="login-sso-wrapper">
                            <GitSSOLoginButton configs={this.state.configs?.git?.configs} />
                          </div>
                        )}
                        {this.state.configs?.google?.enabled && (
                          <div className="login-sso-wrapper">
                            <GoogleSSOLoginButton
                              configs={this.state.configs?.google?.configs}
                              configId={this.state.configs?.google?.config_id}
                            />
                          </div>
                        )}
                        <div className="separator-onboarding ">
                          <div className="mt-2 separator">
                            <h2>
                              <span>OR</span>
                            </h2>
                          </div>
                        </div>

                        <div className="">
                          <label className="common-auth-sub-label">Work email</label>
                          <input
                            onChange={this.handleChange}
                            name="email"
                            type="email"
                            className="login-input"
                            placeholder="Enter your Work email"
                            style={{ backgroundColor: '#fff' }}
                          />
                        </div>
                        <div className="">
                          <label className="common-auth-sub-label">
                            Password
                            <span style={{ marginLeft: '4px' }}>
                              <Link to={'/forgot-password'} tabIndex="-1" className="login-forgot-password">
                                Forgot?
                              </Link>
                            </span>
                          </label>
                          <div className="login-password">
                            <input
                              onChange={this.handleChange}
                              name="password"
                              type={this.state.showPassword ? 'text' : 'password'}
                              className="login-input"
                              placeholder="Enter new password"
                              autoComplete="off"
                              style={{ backgroundColor: '#fff' }}
                            />
                            <img
                              src={`${
                                this.state.showPassword
                                  ? 'assets/images/onboarding assets /01 Icons /Eye_hide.svg'
                                  : 'assets/images/onboarding assets /01 Icons /Eye_show.svg'
                              }`}
                              onClick={this.handleOnCheck}
                              className="login-password-hide-img "
                            ></img>
                            {/* <span className="input-group-text"></span> */}
                          </div>
                        </div>
                        {/* <div className="form-check show-password-field">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="check-input"
                          name="check-input"
                          onChange={this.handleOnCheck}
                        />

                        <label className="form-check-label show-password-label" htmlFor="check-input">
                          show password
                        </label>
                      </div> */}
                      </div>
                    )}
                    <div className={` d-flex flex-column align-items-center ${!configs?.form?.enabled ? 'mt-0' : ''}`}>
                      {configs?.form?.enabled && (
                        <button
                          style={{ width: '352px' }}
                          className={`onboarding-page-continue-button login-continue-button ${
                            isLoading ? 'btn-loading' : ''
                          }`}
                          onClick={this.authUser}
                          disabled={isLoading || !this.state.email || !this.state.password}
                        >
                          Log in
                          <img
                            src="assets/images/onboarding assets /01 Icons /Enter.svg"
                            className="onboarding-enter-icon"
                          ></img>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </form>
              <div></div>

              {authenticationService?.currentUserValue?.organization && (
                <div className="text-center mt-3">
                  back to <Link to="/">{authenticationService?.currentUserValue?.organization}</Link>
                </div>
              )}
            </div>
          </div>
          <div className="common-auth-section-right-wrapper">
            <img
              src="assets/images/onboarding assets /02 Illustrations /cta.png"
              className="onboarding-cta-image"
            ></img>
            <p className="login-testimonial">
              “We definitely wanted to invest in low-code technology to ensure our razor focus is on bringing feature
              richness, experience and proven scale -
            </p>
            <div className="onboarding-testimonial-container">
              <img className="onboarding-testimonial-img"></img>
              <div>
                <p className="py-0 testimonial-name">Ritesh Dhoot</p>
                <p className="testimonial-position">VP of Engineering, Byju’s</p>
              </div>
            </div>
            <div className="onboarding-clients">
              <img className="byjus-img" src="/assets/images/clients/Byju.png"></img>
              <img className="orange-img" src="/assets/images/clients/orange.png"></img>
              <img className="sequoia-img" src="/assets/images/clients/Sequoia.png"></img>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export { LoginPage2 };
