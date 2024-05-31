import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import { validateEmail } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import posthog from 'posthog-js';
import initPosthog from '../_helpers/initPosthog';
import { withRouter } from '@/_hoc/withRouter';
import { redirectToDashboard, getRedirectTo } from '@/_helpers/routes';
import { setCookie } from '@/_helpers/cookie';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import cx from 'classnames';
import SSOLoginModule from './SSOLoginModule';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';

class LoginPageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showPassword: false,
      emailError: false,
      redirectTo: null,
    };
    this.organizationId = props.organizationId;
    this.paramOrganizationSlug = props?.params?.organizationId;
  }
  darkMode = localStorage.getItem('darkMode') === 'true';
  whiteLabelText = retrieveWhiteLabelText();

  componentDidMount() {
    /* remove login oranization's id and slug from the cookie */
    this.setRedirectUrlToCookie();

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

  setRedirectUrlToCookie() {
    // Page is loaded inside an iframe
    const iframe = window !== window.top;
    const redirectPath = getRedirectTo(
      iframe ? new URL(window.location.href).searchParams : new URL(location.href).searchParams
    );

    if (iframe) {
      window.parent.postMessage(
        {
          type: 'redirectTo',
          payload: {
            redirectPath: redirectPath,
          },
        },
        '*'
      );
    }

    authenticationService.saveLoginOrganizationId(this.organizationId);
    authenticationService.saveLoginOrganizationSlug(this.paramOrganizationSlug);
    redirectPath && setCookie('redirectPath', redirectPath, iframe);
    this.setState({
      redirectTo: redirectPath,
    });
  }

  authUser = (e) => {
    e.preventDefault();
    this.setRedirectUrlToCookie();

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

  authSuccessHandler = (user) => {
    updateCurrentSession({
      isUserLoggingIn: true,
    });
    onLoginSuccess(user, this.props.navigate);
  };

  authFailureHandler = (res) => {
    toast.error(res.error || 'Invalid email or password', {
      id: 'toast-login-auth-error',
      position: 'top-center',
      style: {
        maxWidth: 'unset',
      },
    });
    this.setState({ isLoading: false });
  };

  render() {
    const { configs, currentOrganizationName } = this.props;
    const { isLoading, redirectTo } = this.state;
    const noLoginMethodsEnabled =
      !configs?.form && !configs?.git && !configs?.google && !configs?.openid && !configs?.ldap && !configs?.saml;

    const isAnySSOEnabled =
      configs?.google?.enabled ||
      configs?.git?.enabled ||
      configs?.ldap?.enabled ||
      configs?.saml?.enabled ||
      configs?.openid?.enabled;

    const shouldShowLoginMethods = configs?.form?.enabled || isAnySSOEnabled;
    const workspaceSignUpEnabled = this.organizationId && configs?.enable_sign_up;
    const instanceSignUpEnabled = !this.organizationId && (configs?.form?.enable_sign_up || configs?.enable_sign_up);
    const isSignUpCTAEnabled = workspaceSignUpEnabled || instanceSignUpEnabled;
    const signUpCTA = workspaceSignUpEnabled ? 'Sign up' : 'Create an account';
    const signupText = workspaceSignUpEnabled
      ? this.props.t('loginSignupPage.newToWorkspace', `New to this workspace?`)
      : this.props.t('loginSignupPage.newToTooljet', ` New to ${this.whiteLabelText}?`, {
          whiteLabelText: this.whiteLabelText,
        });
    const signUpUrl = `/signup${this.paramOrganizationSlug ? `/${this.paramOrganizationSlug}` : ''}${
      redirectTo ? `?redirectTo=${redirectTo}` : ''
    }`;

    return (
      <>
        <div className="common-auth-section-whole-wrapper page">
          <div className="common-auth-section-left-wrapper">
            <OnboardingNavbar darkMode={this.darkMode} />
            <div className="common-auth-section-left-wrapper-grid">
              <form action="." method="get" autoComplete="off">
                {
                  /* If the configs don't have any organization id. that means the workspace slug is invalid */
                  this.paramOrganizationSlug && !configs?.id ? (
                    <Navigate to="/error/invalid-link" />
                  ) : (
                    <div className="common-auth-container-wrapper ">
                      {noLoginMethodsEnabled && (
                        <div className="text-center-onboard">
                          <h2 data-cy="no-login-methods-warning">
                            {this.props.t(
                              'loginSignupPage.noLoginMethodsEnabled',
                              'No login methods enabled for this workspace'
                            )}
                          </h2>
                        </div>
                      )}
                      <div>
                        {shouldShowLoginMethods && (
                          <>
                            <h2 className="common-auth-section-header sign-in-header" data-cy="sign-in-header">
                              {this.props.t('loginSignupPage.signIn', `Sign in`)}
                            </h2>
                            {this.organizationId && (
                              <p
                                className={cx('text-center-onboard workspace-login-description', {
                                  'change-margin': workspaceSignUpEnabled,
                                })}
                                data-cy="workspace-sign-in-sub-header"
                              >
                                Sign in to your workspace - {configs?.name}
                              </p>
                            )}
                            <div className="tj-text-input-label">
                              {isSignUpCTAEnabled && (
                                <div
                                  className={cx('common-auth-sub-header sign-in-sub-header', {
                                    'change-margin': workspaceSignUpEnabled,
                                  })}
                                  data-cy="sign-in-sub-header"
                                >
                                  {this.props.t('newToTooljet', signupText)}
                                  <Link
                                    to={signUpUrl}
                                    tabIndex="-1"
                                    style={{ marginLeft: '4px' }}
                                    data-cy="create-an-account-link"
                                  >
                                    {this.props.t('createToolJetAccount', signUpCTA)}
                                  </Link>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        <SSOLoginModule
                          configs={configs}
                          organizationSlug={this.paramOrganizationSlug}
                          setRedirectUrlToCookie={() => this.setRedirectUrlToCookie()}
                          buttonText={'Sign in with'}
                        />
                        {configs?.form?.enabled && isAnySSOEnabled && (
                          <div className="separator-onboarding ">
                            <div className="mt-2 separator" data-cy="onboarding-separator">
                              <h2>
                                <span>OR</span>
                              </h2>
                            </div>
                          </div>
                        )}
                        {configs?.form?.enabled && (
                          <>
                            <div className="signin-email-wrap">
                              <label className="tj-text-input-label" data-cy="work-email-label">
                                {this.props.t('loginSignupPage.workEmail', 'Email?')}
                              </label>
                              <input
                                onChange={this.handleChange}
                                name="email"
                                type="email"
                                className="tj-text-input"
                                placeholder={this.props.t('loginSignupPage.enterWorkEmail', 'Enter your email')}
                                style={{ marginBottom: '0px' }}
                                data-cy="work-email-input"
                                autoFocus
                                autoComplete="off"
                              />
                              {this.state?.emailError && (
                                <span className="tj-text-input-error-state" data-cy="email-error-message">
                                  {this.state?.emailError}
                                </span>
                              )}
                            </div>
                            <div>
                              <label className="tj-text-input-label" data-cy="password-label">
                                {this.props.t('loginSignupPage.password', 'Password')}
                                <span style={{ marginLeft: '4px' }}>
                                  <Link
                                    to={'/forgot-password'}
                                    tabIndex="-1"
                                    className="login-forgot-password"
                                    style={{ color: this.darkMode && '#3E63DD' }}
                                    data-cy="forgot-password-link"
                                  >
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
                                  data-cy="password-input-field"
                                  autoComplete="new-password"
                                />

                                <div
                                  className="login-password-hide-img"
                                  onClick={this.handleOnCheck}
                                  data-cy="show-password-icon"
                                >
                                  {this.state?.showPassword ? (
                                    <EyeHide
                                      fill={
                                        this.darkMode
                                          ? this.state?.password?.length
                                            ? '#D1D5DB'
                                            : '#656565'
                                          : this.state?.password?.length
                                          ? '#384151'
                                          : '#D1D5DB'
                                      }
                                    />
                                  ) : (
                                    <EyeShow
                                      fill={
                                        this.darkMode
                                          ? this.state?.password?.length
                                            ? '#D1D5DB'
                                            : '#656565'
                                          : this.state?.password?.length
                                          ? '#384151'
                                          : '#D1D5DB'
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div
                        className={` d-flex flex-column align-items-center ${!configs?.form?.enabled ? 'mt-0' : ''}`}
                      >
                        {configs?.form?.enabled && (
                          <ButtonSolid
                            className="login-btn"
                            onClick={this.authUser}
                            disabled={isLoading}
                            data-cy="login-button"
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
                                  fill={
                                    isLoading || !this.state?.email || !this.state?.password
                                      ? this.darkMode
                                        ? '#656565'
                                        : ' #D1D5DB'
                                      : '#fff'
                                  }
                                ></EnterIcon>
                              </>
                            )}
                          </ButtonSolid>
                        )}
                        {currentOrganizationName && this.organizationId && (
                          <div
                            className="text-center-onboard mt-3"
                            data-cy={`back-to-${String(currentOrganizationName).toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            back to&nbsp; <Link onClick={() => redirectToDashboard()}>{currentOrganizationName}</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export const LoginPage = withTranslation()(withRouter(LoginPageComponent));
