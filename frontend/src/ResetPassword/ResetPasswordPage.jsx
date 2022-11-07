import React from 'react';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import { PasswordResetinfoScreen } from '@/successInfoScreen';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';
import { ButtonSolid } from '../_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import { withTranslation } from 'react-i18next';
import Spinner from '@/_ui/Spinner';

class ResetPasswordComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      token: '',
      email: '',
      password: '',
      showResponseScreen: false,
      showPassword: false,
      password_confirmation: '',
      showConfirmPassword: false,
    };
  }
  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };
  handleOnConfirmCheck = () => {
    this.setState((prev) => ({ showConfirmPassword: !prev.showConfirmPassword }));
  };
  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value?.trim() });
  };

  handleClick = (event) => {
    event.preventDefault();
    const { token } = this.props.location.state;
    const { password, password_confirmation } = this.state;
    if (!password || !password.trim() || !password_confirmation || !password_confirmation.trim()) {
      toast.error("Password shouldn't be empty or contain white space(s)", {
        position: 'top-center',
      });
      return;
    }
    if (password !== password_confirmation) {
      toast.error("Password don't match");
    } else {
      this.setState({
        isLoading: true,
      });
      authenticationService
        .resetPassword({ ...this.state, token })
        .then(() => {
          toast.success('Password reset successfully');
          this.setState({ showResponseScreen: true, isLoading: false });
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
    const { isLoading, password, password_confirmation, showConfirmPassword, showPassword, showResponseScreen } =
      this.state;

    return (
      <div className="common-auth-section-whole-wrapper page">
        <div className="common-auth-section-left-wrapper">
          <OnboardingNavbar />
          <div className="common-auth-section-left-wrapper-grid">
            <div></div>

            <form action="." method="get" autoComplete="off">
              <div className="common-auth-container-wrapper ">
                {!showResponseScreen ? (
                  <>
                    <h2 className="common-auth-section-header reset-password-header">Reset Password</h2>
                    <div className="reset-password-input-container">
                      <label className="tj-text-input-label">New Password</label>
                      <div className="login-password">
                        <input
                          onChange={this.handleChange}
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          autoComplete="off"
                          className="tj-text-input reset-password-input"
                        />
                        <div className="signup-password-hide-img" onClick={this.handleOnCheck}>
                          {showPassword ? (
                            <EyeHide fill={password?.length ? '#384151' : '#D1D5DB'} />
                          ) : (
                            <EyeShow fill={password?.length ? '#384151' : '#D1D5DB'} />
                          )}
                        </div>
                        <span className="tj-input-helper-text">Password must be atleast 5 characters</span>

                        <span></span>
                      </div>
                    </div>
                    <div className="reset-password-input-container">
                      <label className="tj-text-input-label">Re-enter the password</label>
                      <div className="login-password">
                        <input
                          onChange={this.handleChange}
                          name="password_confirmation"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter the password"
                          autoComplete="off"
                          className="tj-text-input reset-password-input"
                        />
                        <div className="signup-password-hide-img" onClick={this.handleOnConfirmCheck}>
                          {showConfirmPassword ? (
                            <EyeHide fill={password_confirmation?.length ? '#384151' : '#D1D5DB'} />
                          ) : (
                            <EyeShow fill={password_confirmation?.length ? '#384151' : '#D1D5DB'} />
                          )}
                        </div>
                        <span className="tj-input-helper-text">Password must be atleast 5 characters</span>

                        <span></span>
                      </div>
                    </div>
                    <div>
                      <ButtonSolid
                        disabled={
                          password?.length < 5 ||
                          password_confirmation?.length < 5 ||
                          isLoading ||
                          password.length !== password_confirmation.length
                        }
                        onClick={this.handleClick}
                        className="reset-password-btn"
                      >
                        {isLoading ? (
                          <div className="spinner-center">
                            <Spinner className="flex" />
                          </div>
                        ) : (
                          <>
                            <span>Reset password</span>

                            <EnterIcon fill={!password || !password_confirmation ? ' #D1D5DB' : '#fff'}></EnterIcon>
                          </>
                        )}
                      </ButtonSolid>
                    </div>
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
          <OnboardingCta />
        </div>
      </div>
    );
  }
}

export const ResetPassword = withTranslation()(ResetPasswordComponent);
