import React from 'react';
import { appService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { ShowLoading } from '@/_components';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { LinkExpiredInfoScreen } from '../SuccessInfoScreen/LinkExpiredInfoScreen';
class OrganizationInvitationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      configs: {},
      isGettingConfigs: true,
      userDetails: {},
      verifiedToken: false,
      showPassword: false,
      fallBack: false,
    };
    this.formRef = React.createRef(null);
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
    this.organizationId = new URLSearchParams(props?.location?.state?.search).get('oid');
    this.source = new URLSearchParams(props?.location?.state?.search).get('source');
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();

    if (!this.single_organization) {
      if (this.organizationId) {
        authenticationService.saveLoginOrganizationId(this.organizationId);
        this.organizationId &&
          authenticationService.getOrganizationConfigs(this.organizationId).then(
            (configs) => {
              this.setState({ isGettingConfigs: false, configs });
            },
            () => {
              this.setState({ isGettingConfigs: false });
            }
          );
      } else {
        this.setState({ isGettingConfigs: false });
      }
    } else {
      authenticationService.getOrganizationConfigs().then(
        (configs) => {
          this.setState({ isGettingConfigs: false, configs });
        },
        () => {
          this.setState({ isGettingConfigs: false });
        }
      );
    }

    authenticationService
      .verifyOrganizationToken(this.props?.location?.state?.token)
      .then((data) => {
        this.setState({ userDetails: data });
        if (data?.email !== '') {
          this.setState({ verifiedToken: true });
        }
      })
      .catch((err) => {
        if (err?.data.statusCode == 400) {
          this.setState({ fallBack: true });
        }
      });
  }
  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };
  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  acceptInvite = (e) => {
    e.preventDefault();

    const isSetPassword = !!this.state?.userDetails?.onboarding_details?.password;
    const token = this.props?.location?.state?.token;
    const { password } = this.state;
    this.setState({ isLoading: true });

    if (isSetPassword) {
      if (!password || !password.trim()) {
        this.setState({ isLoading: false });
        toast.error("Password shouldn't be empty or contain white space(s)", {
          position: 'top-center',
        });
        return;
      }
    }

    appService
      .acceptInvite({
        token,
        password,
      })
      .then((response) => {
        this.setState({ isLoading: false });
        if (!response.ok) {
          return toast.error('Error while setting up your account.', { position: 'top-center' });
        }
        if (response.status == 201) {
          toast.success(`Added to the workspace${isSetPassword ? ' and password has been set ' : ' '}successfully.`);
          if (this.single_organization) {
            const json = response?.json();
            json.then((res) => {
              authenticationService.updateUser(res?.user);
              authenticationService.deleteLoginOrganizationId();
              this.props.history.push('/login');
            });
          } else this.props.history.push('/login');
        }
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  };

  render() {
    const { isLoading, isGettingConfigs, userDetails, fallBack } = this.state;

    return (
      <div className="page" ref={this.formRef}>
        {fallBack ? (
          <>
            <OnboardingNavbar />
            <div className="link-expired-info-wrapper">
              <LinkExpiredInfoScreen show={false} />
            </div>
          </>
        ) : (
          <div>
            {!this.single_organization ? (
              <div className="page common-auth-section-whole-wrapper">
                <div className="common-auth-section-left-wrapper">
                  <OnboardingNavbar />
                  <div className="common-auth-section-left-wrapper-grid">
                    <form action="." method="get" autoComplete="off">
                      {isGettingConfigs ? (
                        <ShowLoading />
                      ) : (
                        <div className="common-auth-container-wrapper">
                          <h2 className="common-auth-section-header org-invite-header">
                            Join {this.state?.configs?.name ? this.state?.configs?.name : 'ToolJet'}
                          </h2>

                          <div className="invite-sub-header">
                            {`You are invited to ${
                              this.state?.configs?.name
                                ? `a workspace ${this.state?.configs?.name}. Accept the invite to join the workspace.`
                                : 'ToolJet.'
                            }`}
                          </div>

                          <div className="org-page-inputs-wrapper">
                            <label className="tj-text-input-label">Name</label>
                            <p className="tj-text-input">{userDetails?.name}</p>
                          </div>

                          <div className="signup-inputs-wrap">
                            <label className="tj-text-input-label">Email</label>
                            <p className="tj-text-input">{userDetails?.email}</p>
                          </div>

                          {userDetails?.onboarding_details?.password && (
                            <div className="mb-3">
                              <label className="form-label" data-cy="password-label">
                                {this.props.t('confirmationPage.password', 'Password')}
                              </label>
                              <div className="org-password">
                                <input
                                  onChange={this.handleChange}
                                  name="password"
                                  type={this.state.showPassword ? 'text' : 'password'}
                                  className="tj-text-input"
                                  placeholder="Enter password"
                                  autoComplete="off"
                                  data-cy="password-input"
                                />

                                <div className="org-password-hide-img" onClick={this.handleOnCheck}>
                                  {this.state?.showPassword ? (
                                    <EyeHide fill={this.state?.password?.length ? '#384151' : '#D1D5DB'} />
                                  ) : (
                                    <EyeShow fill={this.state?.password?.length ? '#384151' : '#D1D5DB'} />
                                  )}
                                </div>

                                <span className="tj-input-helper-text">
                                  {this.props.t(
                                    'loginSignupPage.passwordCharacter',
                                    'Password must be at least 5 character'
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                          <div>
                            <ButtonSolid
                              className="org-btn login-btn"
                              onClick={(e) => this.acceptInvite(e)}
                              disabled={
                                userDetails?.onboarding_details?.password &&
                                (isLoading || !this.state?.password || this.state?.password?.length < 5)
                              }
                              data-cy="accept-invite-button"
                            >
                              {isLoading ? (
                                <div className="spinner-center">
                                  <Spinner />
                                </div>
                              ) : (
                                <>
                                  <span>{this.props.t('confirmationPage.acceptInvite', 'Accept invite')}</span>
                                  <EnterIcon className="enter-icon-onboard" />
                                </>
                              )}
                            </ButtonSolid>
                          </div>
                          <p className="text-center-onboard d-block">
                            By signing up you are agreeing to the
                            <br />
                            <span>
                              <a href="https://www.tooljet.com/terms">Terms of Service </a>&
                              <a href="https://www.tooljet.com/privacy"> Privacy Policy</a>
                            </span>
                          </p>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="page common-auth-section-whole-wrapper">
                  <div className="common-auth-section-left-wrapper">
                    <OnboardingNavbar />
                    <div className="common-auth-section-left-wrapper-grid">
                      <form action="." method="get" autoComplete="off">
                        {isGettingConfigs ? (
                          <ShowLoading />
                        ) : (
                          <div className="common-auth-container-wrapper">
                            <h2 className="common-auth-section-header org-invite-header" data-cy="invite-page-header">
                              Join {this.state?.configs?.name ? this.state?.configs?.name : 'ToolJet'}
                            </h2>

                            <div className="invite-sub-header" data-cy="invite-page-sub-header">
                              {`You are invited to ${
                                this.state?.configs?.name
                                  ? `a workspace ${this.state?.configs?.name}. Accept the invite to join the workspace.`
                                  : 'ToolJet.'
                              }`}
                            </div>
                            {this.source !== 'sso' &&
                              (this.state?.configs?.google?.enabled || this.state?.configs?.git?.enabled) && (
                                <div className="d-flex flex-column">
                                  {this.state?.configs?.google?.enabled && (
                                    <div className="login-sso-wrapper">
                                      <GoogleSSOLoginButton
                                        text={this.props.t('confirmationPage.signupWithGoogle', 'Sign up with Google')}
                                        configs={this.state?.configs?.google?.configs}
                                        configId={this.state?.configs?.google?.config_id}
                                      />
                                    </div>
                                  )}
                                  {this.state?.configs?.git?.enabled && (
                                    <div className="login-sso-wrapper">
                                      <GitSSOLoginButton
                                        text={this.props.t('confirmationPage.signupWithGitHub', 'Sign up with GitHub')}
                                        configs={this.state?.configs?.git?.configs}
                                      />
                                    </div>
                                  )}
                                  <div className="separator-onboarding ">
                                    <div className="mt-2 separator">
                                      <h2>
                                        <span>{this.props.t('confirmationPage.or', 'OR')}</span>
                                      </h2>
                                    </div>
                                  </div>
                                </div>
                              )}

                            <div className="org-page-inputs-wrapper">
                              <label className="tj-text-input-label" data-cy="name-input-label">
                                Name
                              </label>
                              <p className="tj-text-input" data-cy="invited-user-name">
                                {userDetails?.name}
                              </p>
                            </div>

                            <div className="signup-inputs-wrap">
                              <label className="tj-text-input-label" data-cy="work-email-label">
                                Email
                              </label>
                              <p className="tj-text-input" data-cy="invited-user-email">
                                {userDetails?.email}
                              </p>
                            </div>

                            {userDetails?.onboarding_details?.password && (
                              <div className="mb-3">
                                <label className="form-label" data-cy="password-label">
                                  {this.props.t('confirmationPage.password', 'Password')}
                                </label>
                                <div className="org-password">
                                  <input
                                    onChange={this.handleChange}
                                    name="password"
                                    type={this.state?.showPassword ? 'text' : 'password'}
                                    className="tj-text-input"
                                    placeholder="Enter password"
                                    autoComplete="off"
                                    data-cy="password-input-field"
                                  />

                                  <div
                                    className="org-password-hide-img"
                                    onClick={this.handleOnCheck}
                                    data-cy="show-password-icon"
                                  >
                                    {this.state.showPassword ? (
                                      <EyeHide fill={this.state?.password?.length ? '#384151' : '#D1D5DB'} />
                                    ) : (
                                      <EyeShow fill={this.state?.password?.length ? '#384151' : '#D1D5DB'} />
                                    )}
                                  </div>
                                  <span className="tj-input-helper-text">
                                    {this.props.t(
                                      'loginSignupPage.passwordCharacter',
                                      'Password must be at least 5 character'
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div>
                              <ButtonSolid
                                className="org-btn login-btn"
                                onClick={(e) => this.acceptInvite(e)}
                                disabled={
                                  isLoading ||
                                  (userDetails?.onboarding_details?.password &&
                                    (!this.state?.password || this.state?.password?.length < 5))
                                }
                                data-cy="accept-invite-button"
                              >
                                {isLoading ? (
                                  <div className="spinner-center">
                                    <Spinner />
                                  </div>
                                ) : (
                                  <>
                                    <span>{this.props.t('confirmationPage.acceptInvite', 'Accept invite')}</span>
                                    <EnterIcon className="enter-icon-onboard" />
                                  </>
                                )}
                              </ButtonSolid>
                            </div>
                            <p className="text-center-onboard d-block" data-cy="signup-terms-helper">
                              By signing up you are agreeing to the
                              <br />
                              <span>
                                <a href="https://www.tooljet.com/terms" data-cy="terms-of-service-link">
                                  Terms of Service{' '}
                                </a>
                                &
                                <a href="https://www.tooljet.com/privacy" data-cy="privacy-policy-link">
                                  {' '}
                                  Privacy Policy
                                </a>
                              </span>
                            </p>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

export const OrganizationInvitationPage = withTranslation()(OrganizationInvitationPageComponent);
