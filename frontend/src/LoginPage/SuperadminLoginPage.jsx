import React, { useState } from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { validateEmail } from '@/_helpers/utils';
import { withTranslation } from 'react-i18next';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { withRouter } from '@/_hoc/withRouter';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';

const SuperadminLoginPageComponent = ({ t }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const shouldDisableLoginButton = !formData.email || !formData.password || isLoading;

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value, emailError: '' });
  };

  const handleOnCheck = () => {
    setShowPassword((prev) => !prev);
  };

  const authUser = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { email, password } = formData;

    if (!validateEmail(email)) {
      setEmailError('Invalid Email');
      setIsLoading(false);
      return;
    }

    if (!password || !password.trim()) {
      toast.error('Invalid email or password', {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
      setIsLoading(false);
      return;
    }

    authenticationService.superAdminLogin(email, password).then(onLoginSuccess, authFailureHandler);
  };

  const authFailureHandler = (res) => {
    setEmailError(res.error);
    setIsLoading(false);
  };

  return (
    <>
      <div className="common-auth-section-whole-wrapper page">
        <div className="common-auth-section-left-wrapper">
          <OnboardingNavbar darkMode={darkMode} />
          <div className="common-auth-section-left-wrapper-grid">
            <form action="." method="get" autoComplete="off">
              <div className="common-auth-container-wrapper ">
                <div>
                  <h2 className={`sign-in-header ${'common-auth-section-header-super-admin'}`} data-cy="sign-in-header">
                    {t('loginSignupPage.signIn', `Sign in`)}
                  </h2>
                  <div className="tj-text-input-label">
                    <div className="tj-text-input-super-admin-label sign-in-sub-header">{'for super admin only'}</div>
                  </div>
                </div>
                <div className="signin-email-wrap">
                  <label className="tj-text-input-label" data-cy="work-email-label">
                    {t('loginSignupPage.workEmail', 'Email?')}
                  </label>
                  <input
                    onChange={handleChange}
                    name="email"
                    type="email"
                    className={`tj-text-input ${emailError ? 'input-error' : ''}`}
                    placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your email')}
                    style={{ marginBottom: '0px' }}
                    data-cy="work-email-input"
                    autoFocus
                    autoComplete="off"
                  />
                  {emailError && (
                    <span className="tj-text-input-error-state" data-cy="email-error-message">
                      {emailError}
                    </span>
                  )}
                </div>
                <div>
                  <label className="tj-text-input-label" data-cy="password-label">
                    {t('loginSignupPage.password', 'Password')}
                    <span style={{ marginLeft: '4px' }}>
                      <Link
                        to={'/forgot-password'}
                        tabIndex="-1"
                        className="login-forgot-password"
                        style={{ color: darkMode && '#3E63DD' }}
                        data-cy="forgot-password-link"
                      >
                        {t('loginSignupPage.forgot', 'Forgot?')}
                      </Link>
                    </span>
                  </label>
                  <div className="login-password">
                    <input
                      onChange={handleChange}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="tj-text-input"
                      placeholder={t('loginSignupPage.EnterPassword', 'Enter password')}
                      data-cy="password-input-field"
                      autoComplete="new-password"
                    />

                    <div className="login-password-hide-img" onClick={handleOnCheck} data-cy="show-password-icon">
                      {showPassword ? (
                        <EyeShow
                          fill={
                            darkMode
                              ? formData.password.length
                                ? '#D1D5DB'
                                : '#656565'
                              : formData.password.length
                              ? '#384151'
                              : '#D1D5DB'
                          }
                        />
                      ) : (
                        <EyeHide
                          fill={
                            darkMode
                              ? formData.password.length
                                ? '#D1D5DB'
                                : '#656565'
                              : formData.password.length
                              ? '#384151'
                              : '#D1D5DB'
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className={` d-flex flex-column align-items-center `}>
                  <ButtonSolid
                    className="login-btn"
                    onClick={authUser}
                    disabled={shouldDisableLoginButton}
                    data-cy="login-button"
                  >
                    {isLoading ? (
                      <div className="spinner-center">
                        <Spinner />
                      </div>
                    ) : (
                      <>
                        <span> {t('loginSignupPage.loginTo', 'Login')}</span>
                        <EnterIcon
                          className="enter-icon-onboard"
                          fill={
                            isLoading || !formData.email || !formData.password
                              ? darkMode
                                ? '#656565'
                                : ' #D1D5DB'
                              : '#fff'
                          }
                        ></EnterIcon>
                      </>
                    )}
                  </ButtonSolid>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export const SuperadminLoginPage = withTranslation()(withRouter(SuperadminLoginPageComponent));
export default SuperadminLoginPage;
