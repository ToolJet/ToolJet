import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OnboardingFormWrapper } from '@/modules/onboarding/components';
import { FormHeader } from '@/modules/common/components';
import './resources/styles/forgot-password-info.styles.scss';

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
      <OnboardingFormWrapper>
        <FormHeader>{t('forgotPasswordInfo.header', 'Check your mail')}</FormHeader>
        <p className="message">{message}</p>
        <span className="info">{info}</span>
        <div className="separator-signup">
          <div className="mt-2 separator" data-cy="onboarding-separator">
            <h2>
              <span data-cy="onboarding-separator-text">{t('common.or', 'OR')}</span>
            </h2>
          </div>
        </div>
        <div className="action-buttons">
          <button onClick={() => navigate('/login')} className="back-to-login-button" data-cy="back-to-login">
            <span>{t('forgotPasswordInfo.backToLogin', 'Back to login')}</span>
          </button>
        </div>
      </OnboardingFormWrapper>
    </div>
  );
};

export default ForgotPasswordInfoScreen;
