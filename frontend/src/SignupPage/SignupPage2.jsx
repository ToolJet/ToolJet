import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { validateEmail } from '../_helpers/utils';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import SignupInfoScreen from '../successInfoScreen/SignupInfoScreen';

class SignupPage2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      showPassword: false,
    };

    this.ssoConfigs = {
      enableSignUp:
        window.public_config?.DISABLE_MULTI_WORKSPACE !== 'true' &&
        window.public_config?.SSO_DISABLE_SIGNUPS !== 'true',
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
          },
        },
      },
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };
  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };
  signup = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email, name, password } = this.state;

    if (!validateEmail(email)) {
      toast.error('Invalid email', {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
      this.setState({ isLoading: false });
      return;
    }

    authenticationService.signup(email).then(
      () => {
        // eslint-disable-next-line no-unused-vars
        const { from } = this.props.location.state || {
          from: { pathname: '/' },
        };
        this.setState({ isLoading: false, signupSuccess: true });
      },
      (e) => {
        toast.error(e?.error || 'Something went wrong!', {
          position: 'top-center',
        });
        this.setState({ isLoading: false });
      }
    );
  };
  render() {
    const { isLoading, signupSuccess } = this.state;

    return (
      <div className="page common-auth-section-whole-wrapper ">
        <div className="common-auth-section-left-wrapper">
          <div className="onboarding-navbar container-xl">
            <img src="assets/images/logo-color.svg" height="17.5" alt="tooljet logo" data-cy="page-logo" />
          </div>

          <div className="common-auth-section-left-wrapper-grid">
            <div></div>

            <form action="." method="get" autoComplete="off">
              {!signupSuccess && (
                <div className="common-auth-container-wrapper ">
                  <h2 className="common-auth-section-header ">Join ToolJet</h2>
                  {!signupSuccess && (
                    <div className="singup-page-signin-redirect">
                      Already have an account? &nbsp;
                      <Link to={'/login'} tabIndex="-1">
                        Sign in
                      </Link>
                    </div>
                  )}
                  {this.ssoConfigs.enableSignUp && (
                    <div>
                      {!this.state.configs?.git?.enabled && (
                        <div className="login-sso-wrapper">
                          <GitSSOLoginButton configs={this.state.configs?.git?.configs} />
                        </div>
                      )}
                      {!this.state.configs?.google?.enabled && (
                        <div className="login-sso-wrapper">
                          <GoogleSSOLoginButton
                            configs={this.state.configs?.google?.configs}
                            configId={this.state.configs?.google?.config_id}
                          />
                        </div>
                      )}
                      {(this.ssoConfigs.configs?.git?.enabled || this.ssoConfigs.configs?.google?.enabled) && (
                        <div className="separator-onboarding">
                          <div className="mt-2 separator">
                            <h2>
                              <span>OR</span>
                            </h2>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className=" common-auth-inputs-wrapper">
                    <label className="tj-text-input-label">Name</label>
                    <input
                      onChange={this.handleChange}
                      name="name"
                      type="name"
                      className="tj-text-input "
                      placeholder="Enter your business name"
                    />
                    <label className="tj-text-input-label">Email address</label>
                    <input
                      onChange={this.handleChange}
                      name="email"
                      type="email"
                      className="tj-text-input"
                      placeholder="Enter your business email"
                    />
                    <label className="tj-text-input-label">Password</label>
                    <div className="login-password singup-password-wrapper">
                      <input
                        onChange={this.handleChange}
                        name="password"
                        type={this.state.showPassword ? 'text' : 'password'}
                        className="tj-text-input"
                        placeholder="Enter new password"
                      />
                      <img
                        src={`${
                          this.state.showPassword
                            ? 'assets/images/onboarding assets /01 Icons /Eye_hide.svg'
                            : 'assets/images/onboarding assets /01 Icons /Eye_show.svg'
                        }`}
                        onClick={this.handleOnCheck}
                        className="singup-password-hide-img "
                      ></img>
                      <span className="common-input-warning-text">Password must be atleast 8 charectors</span>
                    </div>

                    {/* <label className=" tj-text-input-label">
                      Confirm Password
                    </label>

                    <input
                      onChange={this.handleChange}
                      name="password"
                      type="password"
                      className="tj-text-input"
                      placeholder="Enter new password"
                    /> */}
                  </div>

                  <div>
                    <button
                      className={`common-continue-btn-auth-section  singup-continue-btn ${
                        isLoading ? 'btn-loading' : ''
                      }`}
                      onClick={this.signup}
                      // disabled={isLoading || !this.state.email || !this.state.password || !this.state.name}
                    >
                      Get started for free
                      <img
                        src="assets/images/onboarding assets /01 Icons /Enter.svg"
                        className="onboarding-enter-icon"
                      ></img>
                    </button>
                  </div>
                  <p className="singup-terms">
                    By Signing up you are agreeing to the
                    <span>
                      <a href="https://www.tooljet.com/privacy">Terms of Service &</a>
                      <a href="https://www.tooljet.com/terms">Privacy Policy.</a>
                    </span>
                  </p>
                </div>
              )}
              {signupSuccess && (
                <div>
                  <SignupInfoScreen props={this.props} email={this.state.email} signup={this.signup} />
                </div>
              )}
            </form>
            <div></div>
          </div>
        </div>

        <div className="common-auth-section-right-wrapper">
          <img src="assets/images/onboarding assets /02 Illustrations /cta.png" className="onboarding-cta-image"></img>
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
    );
  }
}

export { SignupPage2 };
