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
import Spinner from '@/_ui/Spinner';
import { useLocation, withRouter } from 'react-router-dom';

class OrganizationInvitationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      configs: {},
      isGettingConfigs: true,
      userDetails: {},
      verifiedToken: false,
    };
    this.formRef = React.createRef(null);
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  }

  componentDidMount() {
    console.log('entry made', this.props.location.state.token);
    // if (!this.single_organization) {
    //   this.setState({ isGettingConfigs: false });
    //   return;
    // }
    authenticationService
      .verifyOrganizationToken(this.props.location.state.token)
      .then((data) => {
        this.setState({ userDetails: data });
        console.log('Data', data);
        if (data?.email !== '') {
          this.setState({ verifiedToken: true });
        }
      })
      .catch((err) => {
        console.log('data err', err);
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

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  acceptInvite = (e, isSetPassword) => {
    e.preventDefault();

    const token = this.props.location.state.token;
    const { password, password_confirmation } = this.state;
    this.setState({ isLoading: true });

    if (isSetPassword) {
      if (!password || !password_confirmation || !password.trim() || !password_confirmation.trim()) {
        this.setState({ isLoading: false });
        toast.error("Password shouldn't be empty or contain white space(s)", {
          position: 'top-center',
        });
        return;
      }

      if (password !== password_confirmation) {
        this.setState({ isLoading: false });
        toast.error("Passwords don't match", {
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
        response.json().then((data) => {
          if (!response.ok) {
            return toast.error(data?.message || 'Error while setting up your account.', { position: 'top-center' });
          }
          toast.success(`Added to the workspace${isSetPassword ? ' and password has been set ' : ' '}successfully.`, {
            position: 'top-center',
          });
          this.props.history.push('/login');
        });
      });
  };

  render() {
    const { isLoading, isGettingConfigs } = this.state;

    return (
      <div className="page" ref={this.formRef}>
        {isGettingConfigs ? (
          <ShowLoading />
        ) : (
          <div className="">
            {!this.single_organization ? (
              <>
                <div className="page common-auth-section-whole-wrapper">
                  <div className="common-auth-section-left-wrapper">
                    <OnboardingNavbar />
                    <div className="common-auth-section-left-wrapper-grid">
                      <div></div>

                      <form action="." method="get" autoComplete="off">
                        <div className="common-auth-container-wrapper">
                          <h2 className="common-auth-section-header">Join Berkspace</h2>

                          <div className="signup-page-signin-redirect">
                            You are invited to a workspace by username. Accept the invite to joing the org
                          </div>

                          <div className="signup-page-inputs-wrapper">
                            <label className="tj-text-input-label">Name</label>
                            <p className="accept-invite-data">Jaseem Aslam</p>
                          </div>

                          <div className="signup-inputs-wrap">
                            <label className="tj-text-input-label">Work email</label>
                            <p className="accept-invite-data">jaseem@tooljet.io</p>
                          </div>

                          <div>
                            <ButtonSolid
                              className="signup-btn"
                              onClick={(e) => this.acceptInvite(e)}
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
                          <p className="">
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
            ) : (
              <>
                <h2 className="card-title text-center mb-4" data-cy="card-title">
                  {this.props.t('confirmationPage.setupAccount', 'Set up your account')}
                </h2>
                {this.state.configs?.enable_sign_up && (
                  <div className="d-flex flex-column align-items-center separator-bottom">
                    {this.state.configs?.google?.enabled && (
                      <GoogleSSOLoginButton
                        text={this.props.t('confirmationPage.signupWithGoogle', 'Sign up with Google')}
                        configs={this.state.configs?.google?.configs}
                        configId={this.state.configs?.google?.config_id}
                      />
                    )}
                    {this.state.configs?.git?.enabled && (
                      <GitSSOLoginButton
                        text={this.props.t('confirmationPage.signupWithGitHub', 'Sign up with GitHub')}
                        configs={this.state.configs?.git?.configs}
                      />
                    )}
                    <div className="mt-2 separator">
                      <h2>
                        <span>{this.props.t('confirmationPage.or', 'OR')}</span>
                      </h2>
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" data-cy="password-label">
                    {this.props.t('confirmationPage.password', 'Password')}
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      onChange={this.handleChange}
                      name="password"
                      type="password"
                      className="form-control"
                      autoComplete="off"
                      data-cy="password-input"
                    />
                    <span className="input-group-text"></span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" data-cy="confirm-password-label">
                    {this.props.t('confirmationPage.confirmPassword', 'Confirm Password')}
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      onChange={this.handleChange}
                      name="password_confirmation"
                      type="password"
                      className="form-control"
                      autoComplete="off"
                      data-cy="confirm-password-input"
                    />
                    <span className="input-group-text"></span>
                  </div>
                </div>
                <div className="form-footer">
                  <p data-cy="terms-and-condition-info">
                    {this.props.t('confirmationPage.clickAndAgree', 'By clicking the button below, you agree to our')}{' '}
                    <a href="https://tooljet.io/terms">
                      {this.props.t('confirmationPage.termsAndConditions', 'Terms and Conditions')}
                    </a>
                    .
                  </p>
                  <button
                    className={`btn mt-2 btn-primary w-100 ${isLoading ? ' btn-loading' : ''}`}
                    onClick={(e) => this.acceptInvite(e, true)}
                    disabled={isLoading}
                    data-cy="finish-setup-button"
                  >
                    {this.props.t('confirmationPage.finishAccountSetup', 'Finish account setup')}{' '}
                    {this.props.t('confirmationPage.and', 'and')}{' '}
                    {this.props.t('confirmationPage.acceptInvite', 'accept invite')}
                  </button>
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
