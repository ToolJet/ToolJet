import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import queryString from 'query-string';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { getSubpath, getWorkspaceId, validateEmail } from '../_helpers/utils';
import { ShowLoading } from '@/_components';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { getCookie, eraseCookie, setCookie } from '@/_helpers/cookie';
import { withRouter } from '@/_hoc/withRouter';
class LoginPageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showPassword: false,
      isGettingConfigs: true,
      configs: undefined,
      emailError: false,
      navigateToLogin: false,
      current_organization_name: null,
    };
    this.organizationId = props.params.organizationId;
  }
  darkMode = localStorage.getItem('darkMode') === 'true';

  returnWorkspaceIdIfNeed = (path) => {
    if (path) {
      return !path.includes('applications') && !path.includes('integrations') ? `/${getWorkspaceId()}` : '';
    }
    return `/${getWorkspaceId()}`;
  };

  componentDidMount() {
    this.setRedirectUrlToCookie();
    authenticationService.deleteLoginOrganizationId();
    this.currentSessionObservable = authenticationService.currentSession.subscribe((newSession) => {
      if (newSession?.current_organization_name)
        this.setState({ current_organization_name: newSession.current_organization_name });
      if (newSession?.group_permissions || newSession?.id) {
        if (
          (!this.organizationId && newSession?.current_organization_id) ||
          (this.organizationId && newSession?.current_organization_id === this.organizationId)
        ) {
          // redirect to home if already logged in
          // set redirect path for sso login
          const path = this.eraseRedirectUrl();
          const redirectPath = `${this.returnWorkspaceIdIfNeed(path)}${path && path !== '/' ? path : ''}`;
          window.location = getSubpath() ? `${getSubpath()}${redirectPath}` : redirectPath;
        }
      }
    });

    if (this.organizationId) {
      authenticationService.saveLoginOrganizationId(this.organizationId);
    }

    authenticationService.getOrganizationConfigs(this.organizationId).then(
      (configs) => {
        this.setState({ isGettingConfigs: false, configs });
      },
      (response) => {
        if (response.data.statusCode !== 404 && response.data.statusCode !== 422) {
          return this.props.navigate({
            pathname: '/',
            state: { errorMessage: 'Error while login, please try again' },
          });
        }

        // If there is no organization found for single organization setup
        // show form to sign up
        // redirected here for self hosted version
        response.data.statusCode !== 422 && this.props.navigate('/setup');

        // if wrong workspace id then show workspace-switching page
        if (response.data.statusCode === 422) {
          authenticationService
            .validateSession()
            .then(({ current_organization_id }) => {
              authenticationService.updateCurrentSession({
                current_organization_id,
              });
              this.props.history.push('/switch-workspace');
            })
            .catch(() => {
              window.location = '/login';
            });
        }

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

  componentWillUnmount() {
    this.currentSessionObservable && this.currentSessionObservable.unsubscribe();
  }

  eraseRedirectUrl() {
    const redirectPath = getCookie('redirectPath');
    redirectPath && eraseCookie('redirectPath');
    return redirectPath;
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, emailError: '' });
  };

  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };

  setRedirectUrlToCookie() {
    const params = new URL(location.href).searchParams;
    const redirectPath = params.get('redirectTo');
    redirectPath && setCookie('redirectPath', redirectPath);
  }

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
    if (from.pathname !== '/confirm')
      // appending workspace-id to avoid 401 error. App.jsx will take the workspace id from URL
      from.pathname = `${this.returnWorkspaceIdIfNeed(from.pathname)}${from.pathname !== '/' ? from.pathname : ''}`;
    const redirectPath = from.pathname === '/confirm' ? '/' : from.pathname;
    this.setState({ isLoading: false });
    this.eraseRedirectUrl();
    window.location = getSubpath() ? `${getSubpath()}${redirectPath}` : redirectPath;
  };

  authFailureHandler = (res) => {
    toast.error(res.error || 'Invalid email or password', {
      id: 'toast-login-auth-error',
      position: 'top-center',
    });
    this.setState({ isLoading: false });
  };

  redirectToUrl = () => {
    const redirectPath = this.eraseRedirectUrl();
    return redirectPath ? redirectPath : '/';
  };

  render() {
    const { isLoading, configs, isGettingConfigs, navigateToLogin } = this.state;
    return (
      <>
        {navigateToLogin ? (
          <Navigate to={this.redirectToUrl()} />
        ) : (
          <div className="common-auth-section-whole-wrapper page">
            <div className="common-auth-section-left-wrapper">
              <OnboardingNavbar darkMode={this.darkMode} />
              <div className="common-auth-section-left-wrapper-grid">
                {this.state.isGettingConfigs && (
                  <div className="loader-wrapper">
                    <ShowLoading />
                  </div>
                )}
                <form action="." method="get" autoComplete="off">
                  {isGettingConfigs ? (
                    <div className="loader-wrapper">
                      <ShowLoading />
                    </div>
                  ) : (
                    <div className="common-auth-container-wrapper ">
                      {!configs?.form && !configs?.git && !configs?.google && (
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
                        {(this.state?.configs?.google?.enabled ||
                          this.state?.configs?.git?.enabled ||
                          configs?.form?.enabled) && (
                          <>
                            <h2 className="common-auth-section-header sign-in-header" data-cy="sign-in-header">
                              {this.props.t('loginSignupPage.signIn', `Sign in`)}
                            </h2>
                            {this.organizationId && (
                              <p
                                className="text-center-onboard workspace-login-description"
                                data-cy="workspace-sign-in-sub-header"
                              >
                                Sign in to your workspace - {configs?.name}
                              </p>
                            )}
                            <div className="tj-text-input-label">
                              {!this.organizationId && (configs?.form?.enable_sign_up || configs?.enable_sign_up) && (
                                <div className="common-auth-sub-header sign-in-sub-header" data-cy="sign-in-sub-header">
                                  {this.props.t('newToTooljet', 'New to ToolJet?')}
                                  <Link
                                    to={'/signup'}
                                    tabIndex="-1"
                                    style={{ marginLeft: '4px' }}
                                    data-cy="create-an-account-link"
                                  >
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
                        {this.state.current_organization_name && this.organizationId && (
                          <div
                            className="text-center-onboard mt-3"
                            data-cy={`back-to-${String(this.state.current_organization_name)
                              .toLowerCase()
                              .replace(/\s+/g, '-')}`}
                          >
                            back to&nbsp;{' '}
                            <Link
                              onClick={() =>
                                (window.location = `${getSubpath() ? getSubpath() : ''}/${
                                  authenticationService.currentSessionValue?.current_organization_id
                                }`)
                              }
                            >
                              {this.state.current_organization_name}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export const LoginPage = withTranslation()(withRouter(LoginPageComponent));
