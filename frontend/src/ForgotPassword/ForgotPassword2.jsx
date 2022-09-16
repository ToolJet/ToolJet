import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../_helpers/utils';
import { authenticationService } from '@/_services';
import { ForgotPasswordInfoScreen } from '@/successInfoScreen';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';

class ForgotPassword2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: '',
      responseShow: false,
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
        this.setState({ responseShow: true });
        // this.props.history.push('/login');
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
                      <h2 className="common-auth-section-header">Forgot password</h2>
                      <p className="common-auth-sub-header">
                        New to toolJet? &nbsp;
                        <Link to={'/signup'} tabIndex="-1">
                          Create an account
                        </Link>
                      </p>
                      <div>
                        <p className="tj-text-input-label">Email address</p>
                        <input
                          onChange={this.handleChange}
                          name="email"
                          type="email"
                          placeholder="Enter email address"
                          className="tj-text-input "
                        />
                      </div>
                      <div>
                        <button
                          className="common-continue-btn-auth-section forgot-password-btn "
                          onClick={this.handleClick}
                          disabled={isLoading || !this.state.email}
                        >
                          Send a reset links
                          <img
                            src="assets/images/onboarding assets /01 Icons /Enter.svg"
                            className="onboarding-enter-icon"
                          ></img>
                        </button>
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

export { ForgotPassword2 };
