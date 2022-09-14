import React from 'react';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import PasswordResetinfoScreen from '../successInfoScreen/PasswordResetinfoScreen';

class ResetPassword2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      token: '',
      email: '',
      password: '',
      showResponseScreen: false,
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value?.trim() });
  };

  handleClick = (event) => {
    event.preventDefault();
    const { token } = this.props.location.state;
    const { password, password_confirmation } = this.state;
    if (password !== password_confirmation) {
      toast.error("Password don't match");
      this.setState({
        password: '',
        password_confirmation: '',
      });
    } else {
      this.setState({
        isLoading: true,
      });
      authenticationService
        .resetPassword({ ...this.state, token })
        .then(() => {
          toast.success('Password reset successfully');
          this.setState({ showResponseScreen: true });
          //   this.props.history.push('/login');
        })
        .catch((res) => {
          this.setState({
            isLoading: false,
          });
          toast.error(res.error || 'Something went wrong, please try again');
        });
    }
  };
  render() {
    const { isLoading } = this.state;

    return (
      <div className="common-auth-section-whole-wrapper page">
        <div className="common-auth-section-left-wrapper">
          <div className="onboarding-navbar">
            <img src="assets/images/logo-color.svg" height="17.5" alt="" data-cy="page-logo" />
          </div>
          <div className="common-auth-section-left-wrapper-grid">
            <div></div>

            <form action="." method="get" autoComplete="off">
              <div className="common-auth-container-wrapper ">
                {!this.state.showResponseScreen ? (
                  <>
                    <h2 className="common-auth-section-header reset-password-header">Reset Password</h2>
                    <div className="reset-password-input-container">
                      <label className="common-auth-sub-label">New Password</label>
                      <div>
                        <input
                          onChange={this.handleChange}
                          name="password"
                          type="password"
                          placeholder="Password"
                          autoComplete="off"
                          className="common-input-auth-section reset-password-input"
                        />
                        <span className="common-input-warning-text">Password must be atleast 8 charectors</span>

                        <span></span>
                      </div>
                    </div>
                    <div className="reset-password-input-container">
                      <label className="common-auth-sub-label">Re-enter the password</label>
                      <div>
                        <input
                          onChange={this.handleChange}
                          name="password_confirmation"
                          type="password"
                          placeholder="Re-enter the password"
                          autoComplete="off"
                          className="common-input-auth-section reset-password-input"
                        />
                        <span className="common-input-warning-text">Password must be atleast 8 charectors</span>

                        <span></span>
                      </div>
                    </div>
                    <div>
                      <button
                        className={`common-continue-btn-auth-section reset-password-continue-btn ${
                          isLoading ? 'btn-loading' : ''
                        }`}
                        onClick={this.handleClick}
                        disabled={!this.state.password || !this.state.password_confirmation}
                      >
                        Reset password
                        <img
                          src="assets/images/onboarding assets /01 Icons /Enter.svg"
                          className="onboarding-enter-icon"
                        ></img>
                      </button>
                    </div>{' '}
                  </>
                ) : (
                  <PasswordResetinfoScreen props={this.props} />
                )}
              </div>
              <div></div>
            </form>
          </div>
        </div>
        <div className="common-auth-section-right-wrapper">
          <img src="assets/images/onboarding assets /02 Illustrations /cta.png" className="onboarding-cta-image"></img>
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
    );
  }
}

export { ResetPassword2 };
