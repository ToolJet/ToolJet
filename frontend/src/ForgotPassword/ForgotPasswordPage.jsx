import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../_helpers/utils';
import { authenticationService } from '@/_services';
import { withTranslation } from 'react-i18next';
class ForgotPasswordComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: '',
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleClick = (event) => {
    event.preventDefault();

    if (!validateEmail(this.state.email)) {
      toast.error('Invalid email', {
        id: 'toast-forgot-password-email-error',
      });
      return;
    }

    this.setState({ isLoading: true });

    authenticationService
      .forgotPassword(this.state.email)
      .then(() => {
        toast.success('Password reset link sent to the email id, please check your mail', {
          id: 'toast-forgot-password-confirmation-code',
        });
        this.props.history.push('/login');
      })
      .catch((res) => {
        toast.error(res.error || 'Something went wrong, please try again', {
          id: 'toast-forgot-password-email-error',
        });
        this.setState({ isLoading: false });
      });
  };

  render() {
    const { isLoading } = this.state;

    return (
      <div className="page page-center">
        <div className="container-tight py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="assets/images/logo-color.svg" height="30" alt="" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">
                {this.props.t('loginSignupPage.forgotPassword', 'Forgot Password')}
              </h2>
              <div className="mb-3">
                <label className="form-label">{this.props.t('loginSignupPage.emailAddress', 'Email address')}</label>
                <input
                  onChange={this.handleChange}
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder={this.props.t('loginSignupPage.enterEmail', 'Enter email')}
                  data-testid="emailField"
                />
              </div>
              <div className="form-footer">
                <button
                  data-testid="submitButton"
                  className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`}
                  onClick={this.handleClick}
                  disabled={isLoading || !this.state.email}
                >
                  {this.props.t('loginSignupPage.resetPassword', 'Reset Password')}
                </button>
              </div>
            </div>
          </form>
          <div className="text-center text-muted mt-3">
            {this.props.t('loginSignupPage.dontHaveAccount', `Don't have account yet?`)}&nbsp;
            <Link to={'/signup'} tabIndex="-1">
              {this.props.t('loginSignupPage.signUp', `Sign up`)}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export const ForgotPassword = withTranslation()(ForgotPasswordComponent);
