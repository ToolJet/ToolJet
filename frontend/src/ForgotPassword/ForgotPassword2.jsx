import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../_helpers/utils';
import { authenticationService } from '@/_services';
import ForgotPasswordInfoScreen from '../successInfoScreen/ForgotPasswordInfoScreen';

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
            <div className="onboarding-navbar">
              <img src="assets/images/logo-color.svg" height="17.5" alt="" data-cy="page-logo" />
            </div>
            <div className="common-auth-section-left-wrapper-grid">
              <div></div>
              <form>
                <div className="common-auth-container-wrapper ">
                  {!this.state.responseShow ? (
                    <>
                      <h2 className="common-auth-section-header">Forgot password</h2>
                      <p className="common-sub-header">
                        New to toolJet? &nbsp;
                        <Link to={'/signup'} tabIndex="-1">
                          Create an account
                        </Link>
                      </p>
                      <div>
                        <p className="common-auth-sub-label">Email address</p>
                        <input
                          onChange={this.handleChange}
                          name="email"
                          type="email"
                          placeholder="Enter email address"
                          data-testid="emailField"
                          className="common-input-auth-section "
                        />
                      </div>
                      <div>
                        <button
                          className="common-continue-btn-auth-section forgot-password-btn "
                          data-testid="submitButton"
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
            <img
              src="assets/images/onboarding assets /02 Illustrations /cta.png"
              className="onboarding-cta-image"
            ></img>
            <p className="login-testimonial">
              “We definitely wanted to invest in low-code technology to ensure our razor focus is on bringing feature
              richness, experience and proven scale -
            </p>
            <div className="onboarding-testimonial-container">
              <img className="onboarding-testimonial-img"></img>
              <div>
                <p className="py-0 testimonial-name">Ritesh Dhoot</p>
                <p className="testimonial-position">VP of Engineering, Byju’s</p>
              </div>
            </div>
            <div className="onboarding-clients">
              <img className="byjus-img" src="/assets/images/clients/Byju.png"></img>
              <img className="orange-img" src="/assets/images/clients/orange.png"></img>
              <img className="sequoia-img" src="/assets/images/clients/Sequoia.png"></img>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export { ForgotPassword2 };
