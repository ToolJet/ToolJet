import React from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export const ForgotPasswordInfoScreen = function ForgotPasswordInfoScreen({ email, darkMode }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="info-screen-wrapper">
      <div className="forget-password-info-card">
        <img
          className="info-screen-email-img"
          src={
            darkMode
              ? 'assets/images/onboardingassets/Illustrations/reset_password mail_dark.svg'
              : 'assets/images/onboardingassets/Illustrations/reset_password_mail.svg'
          }
          alt={t('successInfoScreen.emailImageAlt', 'Email image')}
          loading="lazy"
          data-cy="email-image"
        />
        <h1 className="common-auth-section-header" data-cy="onboarding-page-header">
          {t('successInfoScreen.checkYourMail', 'Check your mail')}
        </h1>
        <p className="info-screen-description" data-cy="onboarding-page-description">
          {t('forgotPasswordInfoScreen.sentEmailPrefix', "We've sent an email to")} {email}{' '}
          {t(
            'forgotPasswordInfoScreen.sentEmailSuffix',
            'with a password reset link. Please click on that link to reset your password.'
          )}
        </p>
        <p className="info-screen-spam-msg" data-cy="email-page-spam-msg">
          {t('successInfoScreen.didNotReceiveEmail', 'Did not receive an email? Check your spam folder.')}
        </p>
        <div className="separator-onboarding">
          <div className="separator">
            <h2 data-cy="onboarding-separator">
              <span data-cy="onboarding-separator-text">{t('globals.or', 'OR')}</span>
            </h2>
          </div>
        </div>
        <ButtonSolid
          variant="secondary"
          className="forgot-password-info-btn"
          onClick={() => navigate('/login')}
          data-cy="back-to-login-button"
        >
          {t('forgotPasswordInfoScreen.backToLogin', 'Back to log in')}
        </ButtonSolid>
      </div>
    </div>
  );
};
