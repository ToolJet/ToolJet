import React from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import { useNavigate } from 'react-router-dom';
export const ForgotPasswordInfoScreen = function ForgotPasswordInfoScreen({ email, darkMode }) {
  const navigate = useNavigate();
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
          alt="email image"
          loading="lazy"
          data-cy="email-image"
        />
        <h1 className="common-auth-section-header" data-cy="onboarding-page-header">
          Check your mail
        </h1>
        <p className="info-screen-description" data-cy="onboarding-page-description">
          We’ve sent an email to {email} with a password reset link. Please click on that link to reset your password.
        </p>
        <p className="info-screen-spam-msg" data-cy="email-page-spam-msg">
          Did not receive an email? Check your spam folder.
        </p>
        <div className="separator-onboarding">
          <div className="separator">
            <h2 data-cy="onboarding-separator">
              <span data-cy="onboarding-separator-text">OR</span>
            </h2>
          </div>
        </div>
        <ButtonSolid
          variant="secondary"
          className="forgot-password-info-btn"
          onClick={() => navigate('/login')}
          data-cy="back-to-login-button"
        >
          Back to log in
        </ButtonSolid>
      </div>
    </div>
  );
};
