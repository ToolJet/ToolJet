import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail } from '@/_helpers/utils';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormTextInput, SubmitButton, FormHeader } from '@/modules/common/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import './resources/styles/forgot-password-form.styles.scss';
import { Alert } from '@/_ui/Alert';
import SepratorComponent from '@/modules/common/components/SepratorComponent';
const ForgotPasswordForm = ({ onSubmit, contactAdmin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDefaultFormEmail, setisDefaultFormEmail] = useState(true);
  const whiteLabelText = retrieveWhiteLabelText();
  useEffect(() => {
    setIsFormValid(validateEmail(email));
    const emailError =
      !isDefaultFormEmail && (email.trim() ? (validateEmail(email) ? '' : 'Email is invalid') : 'Email is required');
    setEmailError(emailError === '' ? '' : emailError);
  }, [email]);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setisDefaultFormEmail(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError(t('forgotPasswordPage.invalidEmail', 'Invalid Email'));
      return;
    }
    setIsLoading(true);
    await onSubmit(email);
    setIsLoading(false);
  };

  return (
    <OnboardingUIWrapper>
      <OnboardingFormInsideWrapper>
        <div className="forgot-password-form">
          <FormHeader>{t('forgotPasswordPage.forgotPassword', 'Forgot Password')}</FormHeader>
          <p className="forgot-password-form-signup-redirect" data-cy="signup-redirect-text">
            {t('forgotPasswordPage.newTo', 'New to')} {whiteLabelText}?{' '}
            <Link
              to="/signup"
              className="signup-link"
              data-cy="create-an-account-link"
              state={{ from: '/forgot-password' }}
            >
              {t('forgotPasswordPage.createAnAccount', 'Create an account')}
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="form-input-area">
            <FormTextInput
              type="email"
              label={t('forgotPasswordPage.emailAddress', 'Email address')}
              placeholder={t('forgotPasswordPage.enterEmailAddress', 'Enter email address')}
              onChange={handleInputChange}
              value={email}
              name="email"
              error={emailError}
              dataCy="email-input-field"
            />
            <SubmitButton
              buttonText={t('forgotPasswordPage.sendResetLink', 'Send a reset link')}
              disabled={!isFormValid || isLoading}
              isLoading={isLoading}
            />
          </form>
          {contactAdmin ? (
            <>
              <SepratorComponent />
              <Alert
                svg="tj-info"
                cls="reset-password-info-banner justify-content-center"
                useDarkMode={false}
                imgHeight={'25px'}
                imgWidth={'25px'}
              >
                <div className="reset-password-info-text" data-cy="reset-password-info-banner">
                  {t('forgotPasswordPage.contactSuperAdmin', 'Contact super admin to reset your password')}
                </div>
              </Alert>
            </>
          ) : (
            <></>
          )}
        </div>
      </OnboardingFormInsideWrapper>
    </OnboardingUIWrapper>
  );
};

export default ForgotPasswordForm;
