import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { validateEmail } from '../_helpers/utils';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { SignupInfoScreen } from '@/successInfoScreen';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';
import { ButtonSolid } from '../_components/AppButton';
import EnterIcon from '../../assets/images/onboarding assets /01 Icons /Enter';
import EyeHide from '../../assets/images/onboarding assets /01 Icons /EyeHide';
import EyeShow from '../../assets/images/onboarding assets /01 Icons /EyeShow';
import { withTranslation } from 'react-i18next';
import { ShowLoading } from '@/_components';

class SignupPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      showPassword: false,
      emailError: '',
      configs: {},
      isGettingConfigs: true,
    };
  }

  componentDidMount() {
    authenticationService.getOrganizationConfigs().then(
      (configs) => {
        this.setState({ isGettingConfigs: false, configs });
      },
      () => {
        this.setState({ isGettingConfigs: false });
      }
    );
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
      // toast.error('Invalid email', {
      //   id: 'toast-login-auth-error',
      //   position: 'top-center',
      // });

      this.setState({ isLoading: false, emailError: 'Invalid email' });
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
          <OnboardingNavbar />

          <div className="common-auth-section-left-wrapper-grid">
            <div></div>
            {this.state.isGettingConfigs ? (
              <ShowLoading />
            ) : (
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
                    {this.state.configs?.enable_sign_up && (
                      <div>
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
                        {(this.state.configs?.git?.enabled || this.state.configs?.google?.enabled) && (
                          <div className="separator-singup">
                            <div className="mt-2 separator">
                              <h2>
                                <span>OR</span>
                              </h2>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="singup-page-inputs-wrapper">
                      <label className="tj-text-input-label">Name</label>
                      <input
                        onChange={this.handleChange}
                        name="name"
                        type="name"
                        className="tj-text-input "
                        placeholder="Enter your business name"
                      />
                      <div className="signup-password-wrap">
                        <label className="tj-text-input-label">Email address</label>
                        <input
                          onChange={this.handleChange}
                          name="email"
                          type="email"
                          className="tj-text-input"
                          placeholder="Enter your business email"
                          style={{ marginBottom: '0px' }}
                        />
                        {this.state.emailError && (
                          <span className="tj-text-input-error-state">{this.state.emailError}</span>
                        )}
                      </div>
                      <label className="tj-text-input-label">Password</label>
                      <div className="login-password singup-password-wrapper">
                        <input
                          onChange={this.handleChange}
                          name="password"
                          type={this.state.showPassword ? 'text' : 'password'}
                          className="tj-text-input"
                          placeholder="Enter new password"
                        />
                        <div className="singup-password-hide-img" onClick={this.handleOnCheck}>
                          {this.state.showPassword ? (
                            <EyeHide fill={this.state.password?.length ? '#384151' : '#D1D5DB'} />
                          ) : (
                            <EyeShow fill={this.state.password?.length ? '#384151' : '#D1D5DB'} />
                          )}
                        </div>
                        <span className="tj-input-helper-text">Password must be atleast 8 charactor</span>
                      </div>
                    </div>

                    <div>
                      <ButtonSolid
                        className="singup-btn"
                        onClick={this.signup}
                        disabled={isLoading || !this.state.email || !this.state.password || !this.state.name}
                      >
                        Get started for free
                        <EnterIcon
                          className="enter-icon-onboard"
                          fill={
                            isLoading || !this.state.email || !this.state.password || !this.state.name
                              ? ' #D1D5DB'
                              : '#fff'
                          }
                        />
                      </ButtonSolid>
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
            )}
            <div></div>
          </div>
        </div>

        <div className="common-auth-section-right-wrapper">
          <OnboardingCta />
        </div>
      </div>
    );
  }
}

export const SignupPage = withTranslation()(SignupPageComponent);
