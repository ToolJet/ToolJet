import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OnboardingUIWrapper } from '@/modules/onboarding/components';
import { FormHeader } from '@/modules/common/components';
import './resources/styles/forgot-password-info.styles.scss';
import SepratorComponent from '@/modules/common/components/SepratorComponent';

const ForgotPasswordInfoScreen = ({ email }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const message = t(
    'forgotPasswordInfo.message',
    "We've sent a password reset link to {{email}}. Click the link inside to reset your password and continue.",
    { email }
  );
  const info = t('forgotPasswordInfo.info', 'Did not receive an email? Check your spam folder!');

  return (
    <div className="forgot-password-info-wrapper info-screen">
      <OnboardingUIWrapper>
        <FormHeader>{t('forgotPasswordInfo.header', 'Check your mail')}</FormHeader>
        <p className="message" data-cy="onboarding-page-description">
          {message}
        </p>
        <span className="info" data-cy="info-message">
          {info}
        </span>
        <SepratorComponent />
        <div className="action-buttons">
          <button onClick={() => navigate('/login')} className="back-to-login-button" data-cy="back-to-login">
            <span className="button-text">{t('forgotPasswordInfo.backToLogin', 'Back to login')}</span>
          </button>
        </div>
      </OnboardingUIWrapper>
    </div>
  );
};

export default ForgotPasswordInfoScreen;
