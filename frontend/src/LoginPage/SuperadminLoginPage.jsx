import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { validateEmail, redirectToWorkspace } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { withRouter } from '@/_hoc/withRouter';

class SuperadminLoginPageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      showPassword: false,
      emailError: false,
      current_organization_name: null,
    };
  }
  darkMode = localStorage.getItem('darkMode') === 'true';

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();
    authenticationService.deleteLoginOrganizationSlug();

    this.currentSessionObservable = authenticationService.currentSession.subscribe((newSession) => {
      if (newSession?.current_organization_name)
        this.setState({ current_organization_name: newSession.current_organization_name });
      if (newSession?.group_permissions || newSession?.id) {
        if (newSession?.current_organization_id) {
          return redirectToWorkspace();
        }
      }
    });

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

    authenticationService.superAdminLogin(email, password).then(this.authSuccessHandler, this.authFailureHandler);
  };

  authSuccessHandler = () => {
    this.setState({ isLoading: false });
  };

  authFailureHandler = (res) => {
    this.setState({ emailError: res.error });
    this.setState({ isLoading: false });
  };

  render() {
    return (
      <>
        <div className="common-auth-section-whole-wrapper page">
          <div className="common-auth-section-left-wrapper">
            <OnboardingNavbar darkMode={this.darkMode} />
            <div className="common-auth-section-left-wrapper-grid">
              <form action="." method="get" autoComplete="off">
                <div className="common-auth-container-wrapper ">
                  <div>
                    <h2
                      className={`sign-in-header ${'common-auth-section-header-super-admin'}`}
                      data-cy="sign-in-header"
                    >
                      {this.props.t('loginSignupPage.signIn', `Sign in`)}
                    </h2>
                    <div className="tj-text-input-label">
                      <div className="tj-text-input-super-admin-label sign-in-sub-header">{'for super admin only'}</div>
                    </div>
                  </div>
                  <div className="signin-email-wrap">
                    <label className="tj-text-input-label" data-cy="work-email-label">
                      {this.props.t('loginSignupPage.workEmail', 'Email?')}
                    </label>
                    <input
                      onChange={this.handleChange}
                      name="email"
                      type="email"
                      className={`tj-text-input ${this.state?.emailError ? 'input-error' : ''}`}
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
                  <div className={` d-flex flex-column align-items-center `}>
                    <ButtonSolid
                      className="login-btn"
                      onClick={this.authUser}
                      disabled={this.state.isLoading}
                      data-cy="login-button"
                    >
                      {this.state.isLoading ? (
                        <div className="spinner-center">
                          <Spinner />
                        </div>
                      ) : (
                        <>
                          <span> {this.props.t('loginSignupPage.loginTo', 'Login')}</span>
                          <EnterIcon
                            className="enter-icon-onboard"
                            fill={
                              this.state.isLoading || !this.state?.email || !this.state?.password
                                ? this.darkMode
                                  ? '#656565'
                                  : ' #D1D5DB'
                                : '#fff'
                            }
                          ></EnterIcon>
                        </>
                      )}
                    </ButtonSolid>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export const SuperadminLoginPage = withTranslation()(withRouter(SuperadminLoginPageComponent));
