import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail, validatePassword } from '@/_helpers/utils';
import { OnboardingFormInsideWrapper, OnboardingUIWrapper } from '@/modules/onboarding/components';
import { FormTextInput, PasswordInput, SubmitButton, FormHeader, SSOAuthModule } from '@/modules/common/components';
import { redirectToDashboard } from '@/_helpers/routes';
import './resources/styles/login-form.styles.scss';
import SepratorComponent from '@/modules/common/components/SepratorComponent';

const LoginForm = ({
  configs,
  organizationId,
  paramOrganizationSlug,
  redirectTo,
  setRedirectUrlToCookie,
  onSubmit,
  currentOrganizationName,
  whiteLabelText,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDefaultFormEmail, setisDefaultFormEmail] = useState(true);
  const [isDefaultFormPassword, setisDefaultFormPassword] = useState(true);
  const defaultfieldStateSetters = {
    email: setisDefaultFormEmail,
    password: setisDefaultFormPassword,
  };
  const isAnySSOEnabled =
    configs?.google?.enabled ||
    configs?.git?.enabled ||
    configs?.ldap?.enabled ||
    configs?.saml?.enabled ||
    configs?.openid?.enabled;

  const noLoginMethodsEnabled = !configs?.form?.enabled && !isAnySSOEnabled;
  const workspaceSignUpEnabled = organizationId && configs?.enable_sign_up;
  const instanceSignUpEnabled = !organizationId && (configs?.form?.enable_sign_up || configs?.enable_sign_up);
  const isSignUpCTAEnabled = workspaceSignUpEnabled || instanceSignUpEnabled;
  const signUpCTA = workspaceSignUpEnabled ? 'Sign up' : 'Create an account';
  const signupText = workspaceSignUpEnabled
    ? t('loginSignupPage.newToWorkspace', 'New to this workspace?')
    : t('loginSignupPage.newToTooljet', 'New to {whiteLabelText}?', { whiteLabelText });
  const signUpUrl = `/signup${paramOrganizationSlug ? `/${paramOrganizationSlug}` : ''}${
    redirectTo ? `?redirectTo=${redirectTo}` : ''
  }`;

  const checkFormValidity = () => {
    const isValid = email.trim() !== '' && validateEmail(email) && password.trim() !== '' && password.length >= 5;
    setIsFormValid(isValid);
  };
  useEffect(() => {
    checkFormValidity();
    const newErrors = {};
    let isValid = true;
    const emailFieldError = !isDefaultFormEmail && validateField('email', email);
    newErrors['email'] = emailFieldError;
    const passwordFieldError = !isDefaultFormPassword && validateField('password', password);
    newErrors['password'] = passwordFieldError;
    if (emailFieldError || passwordFieldError) isValid = false;
    setErrors(newErrors);
    setIsFormValid(isValid && email != '' && password != '');
  }, [email, password]);

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return value.trim() ? (validateEmail(value) ? '' : 'Email is invalid') : 'Email is required';
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (defaultfieldStateSetters[name]) {
      defaultfieldStateSetters[name](false);
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid Email' }));
      setIsLoading(false);
      return;
    }
    if (!password || !password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      setIsLoading(false);
      return;
    }
    if (password.length > 100) {
      setErrors((prev) => ({ ...prev, password: 'Password can be at max 100 characters long' }));
      setIsLoading(false);
      return;
    }
    onSubmit(email, password, () => {
      setIsLoading(false);
    });
  };

  return (
    <div className="login-form">
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          {noLoginMethodsEnabled ? (
            <div className="text-center-onboard">
              <h2 data-cy="no-login-methods-warning">
                {t('loginSignupPage.noLoginMethodsEnabled', 'No login methods enabled for this workspace')}
              </h2>
            </div>
          ) : (
            <>
              <FormHeader>{t('loginSignupPage.signIn', 'Sign in')}</FormHeader>
              {organizationId || isSignUpCTAEnabled ? (
                <p className="signup-info" data-cy="signup-info">
                  {organizationId && (
                    <>
                      Sign in to the workspace - <span className="workspace-name">{configs?.name}</span>.
                    </>
                  )}{' '}
                  {isSignUpCTAEnabled && (
                    <>
                      {' '}
                      {signupText}{' '}
                      <Link to={signUpUrl} className="signin-link" tabIndex="-1" data-cy="signin-link">
                        {t('createToolJetAccount', signUpCTA)}
                      </Link>
                    </>
                  )}
                </p>
              ) : (
                <>
                  <span className="free-space"></span>
                </>
              )}
              {configs?.form?.enabled && (
                <form onSubmit={handleSubmit} className="form-input-area">
                  <FormTextInput
                    label={t('loginSignupPage.workEmail', 'Email?')}
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your email')}
                    error={errors.email}
                  />
                  <PasswordInput
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    placeholder={t('loginSignupPage.enterPassword', 'Enter your password')}
                    error={errors.password}
                    showForgotPassword={true}
                    hint={''}
                  />
                  <SubmitButton
                    buttonText={t('loginSignupPage.sigin', 'Sign in')}
                    disabled={!isFormValid || isLoading}
                    isLoading={isLoading}
                  />
                </form>
              )}
              {isAnySSOEnabled && configs?.form?.enabled && <SepratorComponent />}
              <SSOAuthModule
                configs={configs}
                organizationSlug={paramOrganizationSlug}
                setRedirectUrlToCookie={setRedirectUrlToCookie}
                buttonText="Sign in with"
              />
              {currentOrganizationName && organizationId && (
                <div
                  className="text-center-onboard mt-3"
                  data-cy={`back-to-${String(currentOrganizationName).toLowerCase().replace(/\s+/g, '-')}`}
                >
                  back to&nbsp; <Link onClick={() => redirectToDashboard()}>{currentOrganizationName}</Link>
                </div>
              )}
            </>
          )}
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
};

export default LoginForm;
