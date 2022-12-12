import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { validateEmail } from '../_helpers/utils';
import GoogleSSOLoginButton from '@ee/components/LoginPage/GoogleSSOLoginButton';
import GitSSOLoginButton from '@ee/components/LoginPage/GitSSOLoginButton';
import { withTranslation } from 'react-i18next';

class SignupPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };

    this.ssoConfigs = {
      enableSignUp:
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
    };
  }

  componentDidMount() {
    authenticationService.deleteLoginOrganizationId();
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  signup = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email } = this.state;

    if (!validateEmail(email)) {
      toast.error('Invalid email', {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
      this.setState({ isLoading: false });
      return;
    }

    authenticationService.signup(email).then(
      () => {
        // eslint-disable-next-line no-unused-vars
        const { from } = this.props.location.state || {
          from: { pathname: '/' },
        };
        this.setState({ isLoading: false, signupSuccess: true });
      },
      (e) => {
        toast.error(e?.error || 'Something went wrong!', {
          position: 'top-center',
        });
        this.setState({ isLoading: false });
      }
    );
  };
  render() {
    const { isLoading, signupSuccess } = this.state;

    return (
      <div className="page page-center">
        <div className="container-tight py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="assets/images/logo-color.svg" height="26" alt="" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            {!signupSuccess && (
              <div className="card-body">
                <h2 className="card-title text-center mb-4">
                  {this.props.t('loginSignupPage.createToolJetAccount', 'Create a ToolJet account')}
                </h2>
                {this.ssoConfigs.enableSignUp && (
                  <div className="d-flex flex-column align-items-center separator-bottom">
                    {this.ssoConfigs.configs?.google?.enabled && (
                      <GoogleSSOLoginButton
                        text="Sign up with Google"
                        configs={this.ssoConfigs.configs?.google?.configs}
                        configId={this.ssoConfigs.configs?.google?.config_id}
                      />
                    )}
                    {this.ssoConfigs.configs?.git?.enabled && (
                      <GitSSOLoginButton text="Sign up with GitHub" configs={this.ssoConfigs.configs?.git?.configs} />
                    )}
                    {(this.ssoConfigs.configs?.git?.enabled || this.ssoConfigs.configs?.google?.enabled) && (
                      <div className="mt-2 separator">
                        <h2>
                          <span>OR</span>
                        </h2>
                      </div>
                    )}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">{this.props.t('loginSignupPage.emailAddress', 'Email address')}</label>
                  <input
                    onChange={this.handleChange}
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder={this.props.t('loginSignupPage.enterBusinessEmail', 'Enter your business email')}
                  />
                </div>
                <div className="form-footer">
                  <button className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`} onClick={this.signup}>
                    {this.props.t('loginSignupPage.signUp', 'Sign up')}
                  </button>
                </div>
              </div>
            )}
            {signupSuccess && (
              <div className="card-body">
                {this.props.t('loginSignupPage.emailConfirmLink', 'Please check your email for confirmation link')}
              </div>
            )}
          </form>
          {!signupSuccess && (
            <div className="text-center text-muted mt-3">
              {this.props.t('loginSignupPage.alreadyHaveAnAccount', 'Already have an account?')}
              <Link to={'/login'} tabIndex="-1">
                {this.props.t('loginSignupPage.signIn', 'Sign in')}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export const SignupPage = withTranslation()(SignupPageComponent);
