import React from 'react';
import { appService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { ShowLoading } from '@/_components';
import { withTranslation } from 'react-i18next';

class ConfirmationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      isGettingConfigs: true,
      configs: {},
    };
    this.formRef = React.createRef(null);
    this.organizationId = new URLSearchParams(props.location.state.search).get('oid');
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  }

  componentDidMount() {
    if (this.single_organization) {
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
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  calculateOffset() {
    const elementHeight = this.formRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  }

  setPassword = (e) => {
    e.preventDefault();
    const { token, organizationToken } = this.props.location.state;
    const { password, organization, role, firstName, lastName, password_confirmation } = this.state;
    this.setState({ isLoading: true });

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

    appService
      .setPasswordFromToken({
        token,
        organizationToken,
        password,
        organization,
        role,
        firstName,
        lastName,
      })
      .then(() => {
        this.setState({ isLoading: false });
        toast.success('Account has been setup successfully.', {
          position: 'top-center',
        });
        this.props.history.push('/login');
      })
      .catch(({ error }) => {
        this.setState({ isLoading: false });
        toast.error(error, { position: 'top-center' });
      });
  };

  render() {
    const { isLoading } = this.state;
    const roles = [
      'CTO/CIO',
      'Founder/CEO',
      'IT Manager',
      'Developer',
      'Designer',
      'Sales Professional',
      'Marketing Professional',
      'Product Manager',
      'Other',
    ];

    const roleOptions = roles.map((role, index) => (
      <option key={index} value={role}>
        {role}
      </option>
    ));

    return (
      <div className="page page-center" ref={this.formRef} style={{ overflowY: 'scroll' }}>
        <div
          className="container-tight py-2 invitation-page"
          style={{ maxHeight: this.formRef.current && this.calculateOffset() }}
        >
          <div className="text-center mb-4">
            <a href=".">
              <img src="assets/images/logo-color.svg" height="30" alt="" data-cy="page-logo" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off" data-cy="confirm-invite-container">
            {this.state.isGettingConfigs ? (
              <ShowLoading />
            ) : (
              <div className="card-body">
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
                    {(this.state.configs?.git?.enabled || this.state.configs?.google?.enabled) && (
                      <div className="mt-2 separator">
                        <h2>
                          <span>{this.props.t('confirmationPage.or', 'OR')}</span>
                        </h2>
                      </div>
                    )}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" data-cy="first-name-label">
                    {this.props.t('confirmationPage.firstName', 'First name')}
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      onChange={this.handleChange}
                      name="firstName"
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      data-cy="first-name-input"
                    />
                    <span className="input-group-text"></span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" data-cy="last-name-label">
                    {this.props.t('confirmationPage.lastName', 'Last name')}
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      onChange={this.handleChange}
                      name="lastName"
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      data-cy="last-name-input"
                    />
                    <span className="input-group-text"></span>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" data-cy="company-label">
                    {this.props.t('confirmationPage.company', 'Company')}
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      onChange={this.handleChange}
                      name="organization"
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      data-cy="workspace-input"
                    />
                    <span className="input-group-text"></span>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-label" data-cy="role-label">
                    {this.props.t('confirmationPage.role', 'Role')}
                  </div>
                  <select
                    className="form-select"
                    name="role"
                    defaultValue=""
                    onChange={this.handleChange}
                    data-cy="role-options"
                  >
                    <option value="" disabled>
                      {this.props.t('confirmationPage.pleaseSelect', 'Please select')}
                    </option>
                    {roleOptions}
                  </select>
                </div>
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
                    onClick={this.setPassword}
                    disabled={isLoading}
                    data-cy="finish-setup-button"
                  >
                    {this.props.t('confirmationPage.finishAccountSetup', 'Finish account setup')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }
}

export const ConfirmationPage = withTranslation()(ConfirmationPageComponent);
