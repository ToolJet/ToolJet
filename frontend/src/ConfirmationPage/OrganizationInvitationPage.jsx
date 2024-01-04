import React from 'react';
import { appService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { ShowLoading } from '@/_components';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { LinkExpiredInfoScreen } from '../SuccessInfoScreen/LinkExpiredInfoScreen';
import { withRouter } from '@/_hoc/withRouter';
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
    this.organizationId = new URLSearchParams(props?.location?.search).get('oid');
    this.source = new URLSearchParams(props?.location?.search).get('source');
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();

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

    authenticationService
      .verifyOrganizationToken(this.props?.params?.token)
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
    const token = this.props?.params?.token;
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
          this.props.navigate('/login');
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
            <OnboardingNavbar darkMode={this.props.darkMode} />
            <div className="link-expired-info-wrapper">
              <LinkExpiredInfoScreen show={false} />
            </div>
          </>
        ) : (
          <div>
            <div className="page common-auth-section-whole-wrapper">
              <div className="common-auth-section-left-wrapper">
                <OnboardingNavbar darkMode={this.props.darkMode} />
                <div className="common-auth-section-left-wrapper-grid">
                  <form action="." method="get" autoComplete="off">
                    {isGettingConfigs ? (
                      <ShowLoading />
                    ) : (
                      <div className="common-auth-container-wrapper">
                        <h2
                          className="common-auth-section-header org-invite-header"
                          data-cy="workspace-invite-page-header"
                        >
                          Join {this.state?.configs?.name ? this.state?.configs?.name : 'ToolJet'}
                        </h2>

                        <div className="invite-sub-header" data-cy="workspace-invite-page-sub-header">
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
                                data-cy="password-input"
                                autoComplete="new-password"
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
                                  'Password must be at least 5 characters'
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
          </div>
        )}
      </div>
    );
  }
}

export const OrganizationInvitationPage = withTranslation()(withRouter(OrganizationInvitationPageComponent));
