import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../_helpers/utils';
import { authenticationService } from '@/_services';
import { ForgotPasswordInfoScreen } from '@/successInfoScreen';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';
import { ButtonSolid } from '../_components/AppButton';
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
        toast.success('Password reset link sent to the email id, please check your mail', {
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
      <>
        <div className="common-auth-section-whole-wrapper page">
          <div className="common-auth-section-left-wrapper">
            <OnboardingNavbar />
            <div className="common-auth-section-left-wrapper-grid">
              <div></div>
              <form>
                <div className="common-auth-container-wrapper ">
                  {!this.state.responseShow ? (
                    <>
                      <h2 className="common-auth-section-header">Forgot Password</h2>
                      <p className="common-auth-sub-header">
                        New to ToolJet? &nbsp;
                        <Link to={'/signup'} tabIndex="-1" style={this.darkMode && { color: '#3E63DD' }}>
                          Create an account
                        </Link>
                      </p>
                      <div className="forgot-input-wrap">
                        <p className="tj-text-input-label">Email address</p>
                        <input
                          onChange={this.handleChange}
                          name="email"
                          type="email"
                          placeholder="Enter email address"
                          className="tj-text-input"
                          style={{ marginBottom: '0px' }}
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
                                fill={
                                  isLoading || !this.state.email ? (this.darkMode ? '#656565' : ' #D1D5DB') : '#fff'
                                }
                              />
                            </>
                          )}
                        </ButtonSolid>
                      </div>
                    </>
                  ) : (
                    <ForgotPasswordInfoScreen props={this.props} email={this.state.email} />
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="common-auth-section-right-wrapper">
            <OnboardingCta />
          </div>
        </div>
      </>
    );
  }
}

export const ForgotPassword = withTranslation()(ForgotPasswordComponent);
