import React from 'react';
import { appService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { ShowLoading } from '@/_components';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';
import { ButtonSolid } from '../_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { LinkExpiredInfoScreen } from '../successInfoScreen/LinkExpiredInfoScreen';

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
    this.organizationId = new URLSearchParams(props.location.state.search).get('oid');
  }

  componentDidMount() {
    if (!this.single_organization) {
      this.setState({ isGettingConfigs: false });
      return;
    }
    authenticationService.deleteLoginOrganizationId();

    if (this.organizationId) {
      // Workspace invite
      authenticationService.saveLoginOrganizationId(this.organizationId);
      authenticationService.getOrganizationConfigs(this.organizationId).then(
        (configs) => {
          this.setState({ isGettingConfigs: false, configs });
        },
        () => {
          this.setState({ isGettingConfigs: false });
        }
      );
    } else {
      // Sign up
      this.setState({
        isGettingConfigs: false,
        enable_sign_up:
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
      });
    }
    authenticationService
      .verifyOrganizationToken(this.props.location.state.token)
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
    authenticationService.getOrganizationConfigs().then(
      (configs) => {
        this.setState({ isGettingConfigs: false, configs });
      },
      () => {
        this.setState({ isGettingConfigs: false });
      }
    );
  }
  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };
  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  acceptInvite = (e, isSetPassword) => {
    e.preventDefault();

    const token = this.props.location.state.token;
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
          this.props.history.push('/login');
        }
      });
  };

  render() {
    const { isLoading, isGettingConfigs, userDetails, fallBack } = this.state;

    return (
      <div className="page" ref={this.formRef}>
        {fallBack ? (
          <div className="org-invite-fallback">
            <LinkExpiredInfoScreen show={false} />
          </div>
        ) : isGettingConfigs ? (
          <ShowLoading />
        ) : (
          <div>
            {!this.single_organization ? (
              <>
                <div className="page page-center">
                  <div className=" container-tight py-2 invitation-page" data-cy="confirm-invite-container">
                    <div className="text-center mb-4 ">
                      <a href=".">
                        <img src="assets/images/logo-color.svg" height="30" alt="" data-cy="page-logo" />
                      </a>
                    </div>
                    <div className="card-body"></div>
                    <h2 className="card-title text-center mb-2" data-cy="card-title">
                      {this.props.t('confirmationPage.accountExists', 'Already have an account?')}
                    </h2>
                    <div className="mb-3">
                      <button
                        className={`btn mt-2 btn-primary w-100 ${isLoading ? ' btn-loading' : ''}`}
                        onClick={(e) => this.acceptInvite(e)}
                        disabled={isLoading}
                        data-cy="accept-invite-button"
                      >
                        {this.props.t('confirmationPage.acceptInvite', 'Accept invite')}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="page common-auth-section-whole-wrapper">
                  <div className="common-auth-section-left-wrapper">
                    <OnboardingNavbar />
                    <div className="common-auth-section-left-wrapper-grid">
                      <div></div>

                      <form action="." method="get" autoComplete="off">
                        <div className="common-auth-container-wrapper">
                          <h2 className="common-auth-section-header">Join Workspace</h2>

                          <div className="signup-page-signin-redirect">
                            {`You are invited to a workspace ${this.state.configs?.name}. Accept the invite to join the org.`}
                          </div>
                          {this.state.configs?.enable_sign_up && (
                            <div className="d-flex flex-column align-items-center separator-bottom">
                              {this.state.configs?.google?.enabled && (
                                <div className="login-sso-wrapper">
                                  <GoogleSSOLoginButton
                                    text={this.props.t('confirmationPage.signupWithGoogle', 'Sign up with Google')}
                                    configs={this.state.configs?.google?.configs}
                                    configId={this.state.configs?.google?.config_id}
                                  />
                                </div>
                              )}
                              {this.state.configs?.git?.enabled && (
                                <div className="login-sso-wrapper">
                                  <GitSSOLoginButton
                                    text={this.props.t('confirmationPage.signupWithGitHub', 'Sign up with GitHub')}
                                    configs={this.state.configs?.git?.configs}
                                  />
                                </div>
                              )}
                              <div className="mt-2 separator">
                                <h2>
                                  <span>{this.props.t('confirmationPage.or', 'OR')}</span>
                                </h2>
                              </div>
                            </div>
                          )}

                          <div className="org-page-inputs-wrapper">
                            <label className="tj-text-input-label">Name</label>
                            <p className="tj-text-input">{userDetails.name}</p>
                          </div>

                          <div className="signup-inputs-wrap">
                            <label className="tj-text-input-label">Work Email</label>
                            <p className="tj-text-input">{userDetails.email}</p>
                          </div>

                          {userDetails.onboarding_details?.password && (
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
                                  {this.state.showPassword ? (
                                    <EyeHide fill={this.state.password?.length ? '#384151' : '#D1D5DB'} />
                                  ) : (
                                    <EyeShow fill={this.state.password?.length ? '#384151' : '#D1D5DB'} />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <ButtonSolid
                              className="org-btn login-btn"
                              onClick={(e) => this.acceptInvite(e, true)}
                              disabled={isLoading || !this.state?.password || this.state?.password?.length < 5}
                              data-cy="accept-invite-button"
                            >
                              {isLoading ? (
                                <div className="spinner-center">
                                  <Spinner />
                                </div>
                              ) : (
                                <>
                                  <span> Accept invite</span>
                                  <EnterIcon className="enter-icon-onboard" />
                                </>
                              )}
                            </ButtonSolid>
                          </div>
                          <p>
                            By Signing up you are agreeing to the
                            <br />
                            <span>
                              <a href="https://www.tooljet.com/terms">Terms of Service &</a>
                              <a href="https://www.tooljet.com/privacy"> Privacy Policy.</a>
                            </span>
                          </p>
                        </div>
                      </form>
                      <div></div>
                    </div>
                  </div>
                  <div className="common-auth-section-right-wrapper">
                    <OnboardingCta isLoading={false} />
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
