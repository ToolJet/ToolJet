import React from 'react';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import { PasswordResetinfoScreen } from '@/SuccessInfoScreen';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import { withTranslation } from 'react-i18next';
import Spinner from '@/_ui/Spinner';
import { withRouter } from '@/_hoc/withRouter';

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
      helperText: 'Password should be at least 5 characters',
      validPassword: true,
      validConfirmPassword: true,
      validConfirmPasswordHelperText: "Passwords don't match, please re-enter",
    };
  }
  darkMode = localStorage.getItem('darkMode') === 'true';

  handleOnCheck = () => {
    this.setState((prev) => ({ showPassword: !prev.showPassword }));
  };

  handlePasswordInput = (event) => {
    const input = event.target.value;
    this.setState({
      [event.target.name]: input,
    });
    if (input.length > 100) {
      this.setState({
        helperText: 'Password should be Max 100 characters',
        validPassword: false,
      });
    } else if (input.length < 5) {
      this.setState({
        helperText: 'Password should be at least 5 characters',
        validPassword: false,
      });
    } else {
      this.setState({
        helperText: 'Password should be at least 5 characters',
        validPassword: true,
      });
    }

    if (this.state.password_confirmation !== input) {
      this.setState({
        validConfirmPassword: false,
      });
    } else {
      this.setState({
        validConfirmPassword: true,
      });
    }
  };
  handleOnConfirmCheck = () => {
    this.setState((prev) => ({ showConfirmPassword: !prev.showConfirmPassword }));
  };
  handleChange = (event) => {
    const { name, value } = event.target;
    const trimmedValue = value.trim();

    this.setState((prevState) => {
      const newState = { [name]: trimmedValue };

      if (name === 'password_confirmation' && prevState.validPassword) {
        if (prevState.password !== trimmedValue) {
          newState.validConfirmPassword = false;
        } else {
          newState.validConfirmPassword = true;
        }
      }

      return newState;
    });
  };

  handleClick = (event) => {
    event.preventDefault();
    const { token } = this.props.params;
    const { password, password_confirmation } = this.state;

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
    const {
      isLoading,
      password,
      password_confirmation,
      showConfirmPassword,
      showPassword,
      showResponseScreen,
      validPassword,
      helperText,
    } = this.state;

    return (
      <div className="common-auth-section-whole-wrapper page">
        <div className="common-auth-section-left-wrapper">
          <OnboardingNavbar darkMode={this.darkMode} />
          <div className="common-auth-section-left-wrapper-grid">
            <form action="." method="get" autoComplete="off">
              <div className="common-auth-container-wrapper ">
                {!showResponseScreen ? (
                  <>
                    <h2
                      className="common-auth-section-header reset-password-header"
                      data-cy="reset-password-page-header"
                    >
                      Reset Password
                    </h2>
                    <div className="reset-password-input-container">
                      <label className="tj-text-input-label" data-cy="new-password-input-label">
                        New Password
                      </label>
                      <div className="login-password">
                        <input
                          onChange={this.handlePasswordInput}
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          autoComplete="off"
                          className="tj-text-input reset-password-input"
                          autoFocus
                          data-cy="new-password-input-field"
                        />
                        <div
                          className="signup-password-hide-img"
                          onClick={this.handleOnCheck}
                          data-cy="password-visiblity-action-button"
                        >
                          {showPassword ? (
                            <EyeHide
                              fill={
                                this.darkMode
                                  ? this.state?.password?.length
                                    ? '#D1D5DB'
                                    : '#656565'
                                  : this.state?.password?.length
                                  ? '#384151'
                                  : '#D1D5DB'
                              }
                            />
                          ) : (
                            <EyeShow
                              fill={
                                this.darkMode
                                  ? this.state?.password?.length
                                    ? '#D1D5DB'
                                    : '#656565'
                                  : this.state?.password?.length
                                  ? '#384151'
                                  : '#D1D5DB'
                              }
                            />
                          )}
                        </div>
                        <span
                          className="tj-input-helper-text"
                          style={{ color: !validPassword ? 'red' : undefined }}
                          data-cy="password-helper-text"
                        >
                          {helperText}
                        </span>

                        <span></span>
                      </div>
                    </div>
                    <div className="reset-password-input-container">
                      <label className="tj-text-input-label" data-cy="confirm-password-input-label">
                        Re-enter the password
                      </label>
                      <div className="login-password">
                        <input
                          onChange={this.handleChange}
                          name="password_confirmation"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter the password"
                          autoComplete="off"
                          className="tj-text-input reset-password-input"
                          data-cy="confirm-password-input-field"
                        />
                        <div
                          className="signup-password-hide-img"
                          onClick={this.handleOnConfirmCheck}
                          data-cy="password-visiblity-action-button"
                        >
                          {showConfirmPassword ? (
                            <EyeHide
                              fill={
                                this.darkMode
                                  ? this.state?.password_confirmation?.length
                                    ? '#D1D5DB'
                                    : '#656565'
                                  : this.state?.password_confirmation?.length
                                  ? '#384151'
                                  : '#D1D5DB'
                              }
                            />
                          ) : (
                            <EyeShow
                              fill={
                                this.darkMode
                                  ? this.state?.password_confirmation?.length
                                    ? '#D1D5DB'
                                    : '#656565'
                                  : this.state?.password_confirmation?.length
                                  ? '#384151'
                                  : '#D1D5DB'
                              }
                            />
                          )}
                        </div>
                        <span
                          className="tj-input-helper-text"
                          style={{ color: !this.state.validConfirmPassword ? 'red' : undefined }}
                          data-cy="password-helper-text"
                        >
                          {this.state.validConfirmPassword === false
                            ? this.state.validConfirmPasswordHelperText
                            : helperText}
                        </span>

                        <span></span>
                      </div>
                    </div>
                    <div>
                      <ButtonSolid
                        disabled={
                          password?.length < 5 ||
                          password_confirmation?.length < 5 ||
                          isLoading ||
                          password.length !== password_confirmation.length ||
                          !validPassword ||
                          password !== password_confirmation
                        }
                        onClick={this.handleClick}
                        className="reset-password-btn"
                        data-cy="reset-password-button"
                      >
                        {isLoading ? (
                          <div className="spinner-center">
                            <Spinner className="flex" />
                          </div>
                        ) : (
                          <>
                            <span>Reset password</span>

                            <EnterIcon
                              fill={
                                !password || !password_confirmation || password.length !== password_confirmation.length
                                  ? this.darkMode
                                    ? '#656565'
                                    : ' #D1D5DB'
                                  : '#fff'
                              }
                            ></EnterIcon>
                          </>
                        )}
                      </ButtonSolid>
                    </div>
                  </>
                ) : (
                  <PasswordResetinfoScreen props={this.props} darkMode={this.darkMode} />
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export const ResetPassword = withTranslation()(withRouter(ResetPasswordComponent));
