import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../_helpers/utils';
import { authenticationService } from '@/_services';
import { ForgotPasswordInfoScreen } from '@/SuccessInfoScreen';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import { withTranslation } from 'react-i18next';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
class ForgotPasswordComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: '',
      responseShow: false,
      emailError: '',
    };
  }
  darkMode = localStorage.getItem('darkMode') === 'true';

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, emailError: '' });
  };

  handleClick = (event) => {
    event.preventDefault();

    if (!validateEmail(this.state.email)) {
      this.setState({ emailError: 'Invalid Email' });
      return;
    }

    this.setState({ isLoading: true });

    authenticationService
      .forgotPassword(this.state.email)
      .then(() => {
        toast.success('Please check your email/inbox for the password reset link', {
          id: 'toast-forgot-password-confirmation-code',
        });
        this.setState({ responseShow: true, isLoading: false });
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
      <div className="common-auth-section-whole-wrapper page">
        <div className="common-auth-section-left-wrapper">
          <OnboardingNavbar darkMode={this.darkMode} />
          <div className="common-auth-section-left-wrapper-grid">
            <form>
              <div className="common-auth-container-wrapper forgot-password-auth-wrapper">
                {!this.state.responseShow ? (
                  <>
                    <h2 className="common-auth-section-header" data-cy="forgot-password-page-header">
                      Forgot Password
                    </h2>
                    <p className="common-auth-sub-header" data-cy="forgot-password-sub-header">
                      New to ToolJet? &nbsp;
                      <Link
                        to={'/signup'}
                        tabIndex="-1"
                        style={{ color: this.darkMode && '#3E63DD' }}
                        data-cy="create-an-account-link"
                      >
                        Create an account
                      </Link>
                    </p>
                    <div className="forgot-input-wrap">
                      <p className="tj-text-input-label" data-cy="email-input-label">
                        Email address
                      </p>
                      <input
                        onChange={this.handleChange}
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        className="tj-text-input"
                        style={{ marginBottom: '0px' }}
                        autoFocus
                        autoComplete="off"
                        data-cy="email-input-field"
                      />
                      {this.state.emailError && (
                        <span className="tj-text-input-error-state">{this.state.emailError}</span>
                      )}
                    </div>
                    <div>
                      <ButtonSolid
                        onClick={(e) => this.handleClick(e)}
                        disabled={isLoading || !this.state.email}
                        className="forget-password-btn"
                        data-cy="reset-password-link"
                      >
                        {isLoading ? (
                          <div className="spinner-center">
                            <Spinner />
                          </div>
                        ) : (
                          <>
                            <span> Send a reset link</span>
                            <EnterIcon
                              className="enter-icon-onboard"
                              fill={isLoading || !this.state.email ? (this.darkMode ? '#656565' : ' #D1D5DB') : '#fff'}
                            />
                          </>
                        )}
                      </ButtonSolid>
                    </div>
                  </>
                ) : (
                  <ForgotPasswordInfoScreen props={this.props} email={this.state.email} darkMode={this.darkMode} />
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export const ForgotPassword = withTranslation()(ForgotPasswordComponent);
