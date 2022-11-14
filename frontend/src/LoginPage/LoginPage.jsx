import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { validateEmail } from '../_helpers/utils';
import { ShowLoading } from '@/_components';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';
import { ButtonSolid } from '../_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';

class LoginPageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showPassword: false,
      isGettingConfigs: true,
      configs: undefined,
      emailError: false,
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
    if (this.organizationId || this.single_organization)
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

    this.props.location?.state?.errorMessage &&
      toast.error(this.props.location.state.errorMessage, {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, emailError: '' });
  };

  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };

  authUser = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email, password } = this.state;

    if (!validateEmail(email)) {
      this.setState({ isLoading: false, emailError: 'Invalid Email' });
      return;
    }

    if (!password || !password.trim()) {
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
    const redirectPath = from.pathname === '/confirm' ? '/' : from;
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
            <OnboardingNavbar />
            <div className="common-auth-section-left-wrapper-grid">
              <div></div>
              <form action="." method="get" autoComplete="off">
                {isGettingConfigs ? (
                  <div className="loader-wrapper">
                    <ShowLoading />
                  </div>
                ) : (
                  <div className="common-auth-container-wrapper ">
                    {!configs && (
                      <div className="text-center">
                        <h2>
                          {this.props.t(
                            'loginSignupPage.noLoginMethodsEnabled',
                            'No login methods enabled for this workspace'
                          )}
                        </h2>
                      </div>
                    )}
                    <div>
                      {(this.state?.configs?.google?.enabled ||
                        this.state?.configs?.git?.enabled ||
                        configs?.form?.enabled) && (
                        <>
                          <h2 className="common-auth-section-header sign-in-header">
                            {this.props.t('loginSignupPage.signIn', `Sign in`)}
                          </h2>
                          {this.organizationId && (
                            <p className="text-center workspace-login-description">
                              Sign in to your workspace - {configs?.name}
                            </p>
                          )}
                          <div className="tj-text-input-label">
                            {!this.organizationId && (configs?.form?.enable_sign_up || configs?.enable_sign_up) && (
                              <div className="common-auth-sub-header sign-in-sub-header">
                                {this.props.t('newToTooljet', 'New to ToolJet?')}
                                <Link to={'/signup'} tabIndex="-1" style={{ marginLeft: '4px' }}>
                                  {this.props.t('loginSignupPage.createToolJetAccount', `Create an account`)}
                                </Link>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {this.state?.configs?.git?.enabled && (
                        <div className="login-sso-wrapper">
                          <GitSSOLoginButton configs={this.state?.configs?.git?.configs} />
                        </div>
                      )}
                      {this.state?.configs?.google?.enabled && (
                        <div className="login-sso-wrapper">
                          <GoogleSSOLoginButton
                            configs={this.state?.configs?.google?.configs}
                            configId={this.state?.configs?.google?.config_id}
                          />
                        </div>
                      )}
                      {(this.state?.configs?.google?.enabled || this.state?.configs?.git?.enabled) &&
                        configs?.form?.enabled && (
                          <div className="separator-onboarding ">
                            <div className="mt-2 separator">
                              <h2>
                                <span>OR</span>
                              </h2>
                            </div>
                          </div>
                        )}
                      {configs?.form?.enabled && (
                        <>
                          <div className="signin-email-wrap">
                            <label className="tj-text-input-label">
                              {this.props.t('loginSignupPage.workEmail', 'Work email?')}
                            </label>
                            <input
                              onChange={this.handleChange}
                              name="email"
                              type="email"
                              className="tj-text-input"
                              placeholder={this.props.t('loginSignupPage.enterWorkEmail', 'Enter your work email')}
                              style={{ marginBottom: '0px' }}
                            />
                            {this.state?.emailError && (
                              <span className="tj-text-input-error-state">{this.state?.emailError}</span>
                            )}
                          </div>
                          <div>
                            <label className="tj-text-input-label">
                              {this.props.t('loginSignupPage.password', 'Password')}
                              <span style={{ marginLeft: '4px' }}>
                                <Link to={'/forgot-password'} tabIndex="-1" className="login-forgot-password">
                                  {this.props.t('loginSignupPage.forgot', 'Forgot?')}
                                </Link>
                              </span>
                            </label>
                            <div className="login-password">
                              <input
                                onChange={this.handleChange}
                                name="password"
                                type={this.state?.showPassword ? 'text' : 'password'}
                                className="tj-text-input"
                                placeholder={this.props.t('loginSignupPage.EnterPassword', 'Enter password')}
                                autoComplete="off"
                              />

                              <div className="login-password-hide-img" onClick={this.handleOnCheck}>
                                {this.state?.showPassword ? (
                                  <EyeHide fill={this.state?.password?.length ? '#384151' : '#D1D5DB'} />
                                ) : (
                                  <EyeShow fill={this.state?.password?.length ? '#384151' : '#D1D5DB'} />
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={` d-flex flex-column align-items-center ${!configs?.form?.enabled ? 'mt-0' : ''}`}>
                      {configs?.form?.enabled && (
                        <ButtonSolid
                          className="login-btn"
                          onClick={this.authUser}
                          disabled={isLoading || !this.state?.email || !this.state?.password}
                        >
                          {isLoading ? (
                            <div className="spinner-center">
                              <Spinner />
                            </div>
                          ) : (
                            <>
                              <span> {this.props.t('loginSignupPage.loginTo', 'Login')}</span>
                              <EnterIcon
                                className="enter-icon-onboard"
                                fill={isLoading || !this.state?.email || !this.state?.password ? ' #D1D5DB' : '#fff'}
                              ></EnterIcon>
                            </>
                          )}
                        </ButtonSolid>
                      )}
                    </div>
                  </div>
                )}
              </form>
              <div></div>
            </div>

            {authenticationService?.currentUserValue?.organization && this.organizationId && (
              <div className="text-center mt-3">
                back to&nbsp; <Link to="/">{authenticationService?.currentUserValue?.organization}</Link>
              </div>
            )}
          </div>
          <div className="common-auth-section-right-wrapper">
            <OnboardingCta />
          </div>
        </div>
      </>
    );
  }
}

export const LoginPage = withTranslation()(LoginPageComponent);
