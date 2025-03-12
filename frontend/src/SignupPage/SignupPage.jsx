import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import { validateEmail } from '../_helpers/utils';
import { SignupInfoScreen } from '@/SuccessInfoScreen';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import { withTranslation } from 'react-i18next';
import Spinner from '@/_ui/Spinner';
import SignupStatusCard from '../OnBoardingForm/SignupStatusCard';
import { withRouter } from '@/_hoc/withRouter';
import { onInvitedUserSignUpSuccess } from '@/_helpers/platform/utils/auth.utils';
import { isEmpty } from 'lodash';
import { EmailComponent } from './EmailComponent';
import SSOLoginModule from '@/LoginPage/SSOLoginModule';
import { checkWhiteLabelsDefaultState } from '@white-label/whiteLabelling';
class SignupPageComponent extends React.Component {
  constructor(props) {
    super(props);
    /* Need these params to organization signup work */
    const routeState = this.props?.location?.state;
    this.organizationToken = routeState?.organizationToken;
    this.inviteeEmail = routeState?.inviteeEmail;
    this.inviteOrganizationId = props.organizationId;
    this.paramInviteOrganizationSlug = props.params.organizationId;
    this.redirectTo = location?.search?.split('redirectTo=')[1];

    this.state = {
      isLoading: false,
      showPassword: false,
      emailError: '',
      disableOnEdit: false,
      email: this.inviteeEmail || '',
      defaultState: false,
    };
  }

  componentDidMount() {
    const errorMessage = this.props?.location?.state?.errorMessage;
    if (errorMessage) {
      toast.error(errorMessage);
    }
    checkWhiteLabelsDefaultState(this.inviteOrganizationId).then((res) => {
      this.setState({ defaultState: res });
    });
  }

  backtoSignup = (email, name) => {
    this.setState({ signupSuccess: false, email: email, name: name, disableOnEdit: true, password: '' });
  };
  darkMode = localStorage.getItem('darkMode') === 'true';

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, emailError: '', disableOnEdit: false });
  };
  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };
  signup = (e) => {
    e.preventDefault();
    const { email, name, password } = this.state;
    if (!password || !password.trim()) {
      toast.error("Password shouldn't be empty or contain white space(s)", {
        position: 'top-center',
      });
      return;
    }
    this.setState({ isLoading: true });

    if (!validateEmail(email)) {
      this.setState({ isLoading: false, emailError: 'Invalid email' });
      return;
    }

    const organizationToken = this.organizationToken;
    if (organizationToken) {
      /* different API */
      authenticationService
        .activateAccountWithToken(email, password, organizationToken)
        .then((response) => onInvitedUserSignUpSuccess(response, this.props.navigate))
        .catch((errorObj) => {
          let errorMessage;
          const isThereAnyErrorsArray = errorObj?.error?.length && typeof errorObj?.error?.[0] === 'string';
          if (isThereAnyErrorsArray) {
            errorMessage = errorObj?.error?.[0];
          } else if (typeof errorObj?.error?.error === 'string') {
            errorMessage = errorObj?.error?.error;
          }
          errorMessage && toast.error(errorMessage);
          const emailError = errorObj?.error?.inputError;
          this.setState({ isLoading: false, emailError });
        });
    } else {
      authenticationService
        .signup(email, name, password, this.inviteOrganizationId, this.redirectTo)
        .then((response) => {
          const { organizationInviteUrl } = response;
          if (organizationInviteUrl) onInvitedUserSignUpSuccess(response, this.props.navigate);
          // eslint-disable-next-line no-unused-vars
          const { from } = this.props.location.state || {
            from: { pathname: '/' },
          };
          this.setState({ isLoading: false, signupSuccess: true });
        })
        .catch((e) => {
          toast.error(e?.error || 'Something went wrong!', {
            position: 'top-center',
          });
          this.setState({ isLoading: false });
        });
    }
  };

  isFormSignUpEnabled = () => {
    const { configs } = this.props;
    return this.inviteOrganizationId ? configs?.form?.enabled : configs?.form?.enable_sign_up;
  };

  setSignupOrganizationDetails = () => {
    authenticationService.setSignUpOrganizationDetails(
      this.inviteOrganizationId,
      this.paramInviteOrganizationSlug,
      this.organizationToken
    );
  };

  render() {
    const { configs } = this.props;
    const { isLoading, signupSuccess, defaultState } = this.state;
    const comingFromInviteFlow = !!this.organizationToken;
    const isSignUpButtonDisabled =
      isLoading ||
      !this.state.email ||
      !this.state.password ||
      (isEmpty(this.state.name) && !comingFromInviteFlow) ||
      this.state.password.length < 5;
    const shouldShowSignInCTA = !this.organizationToken;
    const isAnySSOEnabled =
      !!configs?.git?.enabled ||
      !!configs?.google?.enabled ||
      !!configs?.openid?.enabled ||
      !!configs?.saml?.enabled ||
      !!configs?.ldap?.enabled;

    const shouldShowSignupDisabledCard =
      !this.organizationToken && !configs?.enable_sign_up && !configs?.form?.enable_sign_up;
    const passwordLabelText = this.organizationToken ? 'Create a password' : 'Password';

    return (
      <div className="page common-auth-section-whole-wrapper">
        <div className="common-auth-section-left-wrapper">
          <OnboardingNavbar darkMode={this.darkMode} />

          <div className="common-auth-section-left-wrapper-grid">
            <form action="." method="get" autoComplete="off">
              {
                /* If the configs don't have any organization id. that means the workspace slug is invalid */
                this.paramInviteOrganizationSlug && !configs?.id ? (
                  <Navigate to="/error/invalid-link" />
                ) : (
                  !signupSuccess && (
                    <>
                      <div className="common-auth-container-wrapper common-auth-signup-container-wrapper">
                        <h2
                          className="common-auth-section-header common-auth-signup-section-header"
                          data-cy="signup-section-header"
                        >
                          {this.props.t('loginSignupPage.signUp', `Sign up`)}
                        </h2>
                        {this.inviteOrganizationId && (
                          <span
                            className="mb-2"
                            data-cy="workspace-signup-header"
                          >{`Sign up to the workspace - ${configs?.name}`}</span>
                        )}
                        {shouldShowSignInCTA ? (
                          <div className="signup-page-signin-redirect" data-cy="signin-redirect-text">
                            {this.props.t('loginSignupPage.alreadyHaveAnAccount', `Already have an account? `)} &nbsp;
                            <Link
                              to={`/login${
                                this.paramInviteOrganizationSlug ? `/${this.paramInviteOrganizationSlug}` : ''
                              }`}
                              tabIndex="-1"
                              data-cy="signin-redirect-link"
                            >
                              {this.props.t('loginSignupPage.signIn', `Sign in`)}
                            </Link>
                          </div>
                        ) : (
                          <div className="mb-3"></div>
                        )}
                        {shouldShowSignupDisabledCard ? (
                          <SignupStatusCard text={'Signup has been disabled by your workspace admin.'} />
                        ) : (
                          <>
                            {(configs?.enable_sign_up || !!this.organizationToken) && (
                              <div>
                                <SSOLoginModule
                                  configs={configs}
                                  setSignupOrganizationDetails={() => this.setSignupOrganizationDetails()}
                                  organizationSlug={this.paramInviteOrganizationSlug}
                                  buttonText="Sign up with"
                                />
                                {isAnySSOEnabled && this.isFormSignUpEnabled() && (
                                  <div className="separator-signup">
                                    <div className="mt-2 separator" data-cy="onboarding-separator">
                                      <h2>
                                        <span data-cy="onboarding-separator-text">OR</span>
                                      </h2>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {this.isFormSignUpEnabled() && (
                              <>
                                <div className="signup-page-inputs-wrapper">
                                  {!comingFromInviteFlow && (
                                    <>
                                      <label className="tj-text-input-label" data-cy="name-input-label">
                                        Name
                                      </label>
                                      <input
                                        onChange={this.handleChange}
                                        name="name"
                                        type="text"
                                        className="tj-text-input"
                                        placeholder={this.props.t(
                                          'loginSignupPage.enterFullName',
                                          'Enter your full name'
                                        )}
                                        value={this.state.name || ''}
                                        data-cy="name-input-field"
                                        autoFocus
                                        autoComplete="off"
                                      />{' '}
                                    </>
                                  )}
                                  <EmailComponent
                                    prefilledEmail={this.inviteeEmail}
                                    email={this.state.email}
                                    handleChange={this.handleChange}
                                    emailError={this.state.emailError}
                                    t={this.props.t}
                                  />
                                  <label className="tj-text-input-label" data-cy="create-a-password-label">
                                    {passwordLabelText}
                                  </label>
                                  <div className="login-password signup-password-wrapper">
                                    <input
                                      onChange={this.handleChange}
                                      name="password"
                                      type={this.state.showPassword ? 'text' : 'password'}
                                      className="tj-text-input"
                                      placeholder={this.props.t(
                                        'loginSignupPage.enterNewPassword',
                                        'Enter new password'
                                      )}
                                      data-cy="password-input-field"
                                      autoComplete="new-password"
                                    />
                                    <div
                                      className="signup-password-hide-img"
                                      onClick={this.handleOnCheck}
                                      data-cy="show-password-icon"
                                    >
                                      {this.state.showPassword ? (
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
                                    <span className="tj-input-helper-text" data-cy="password-helper-text">
                                      {this.props.t(
                                        'loginSignupPage.passwordCharacter',
                                        'Password must be at least 5 characters'
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <ButtonSolid
                                    className="signup-btn"
                                    onClick={this.signup}
                                    disabled={isSignUpButtonDisabled}
                                    data-cy="sign-up-button"
                                  >
                                    {isLoading ? (
                                      <div className="spinner-center">
                                        <Spinner />
                                      </div>
                                    ) : (
                                      <>
                                        <span>
                                          {this.props.t('loginSignupPage.getStartedForFree', 'Get started for free')}
                                        </span>
                                        <EnterIcon
                                          className="enter-icon-onboard"
                                          fill={
                                            isSignUpButtonDisabled ? (this.darkMode ? '#656565' : ' #D1D5DB') : '#fff'
                                          }
                                        />
                                      </>
                                    )}
                                  </ButtonSolid>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {defaultState && (
                          <p className="signup-terms" data-cy="signup-terms-helper">
                            By signing up you are agreeing to the
                            <br />
                            <span>
                              <a href="https://www.tooljet.com/terms" data-cy="terms-of-service-link">
                                Terms of Service{' '}
                              </a>
                              <span>& </span>
                              <a href="https://www.tooljet.com/privacy" data-cy="privacy-policy-link">
                                {' '}
                                Privacy Policy
                              </a>
                            </span>
                          </p>
                        )}
                      </div>
                    </>
                  )
                )
              }
              {signupSuccess && (
                <div>
                  <SignupInfoScreen
                    props={this.props}
                    email={this.state.email}
                    name={this.state.name}
                    backtoSignup={this.backtoSignup}
                    darkMode={this.darkMode}
                    organizationId={this.inviteOrganizationId}
                    redirectTo={this.redirectTo}
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export const SignupPage = withTranslation()(withRouter(SignupPageComponent));
