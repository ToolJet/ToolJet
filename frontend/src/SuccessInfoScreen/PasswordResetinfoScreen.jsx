import React from 'react';
import { ButtonSolid } from '@/_components/AppButton';

export const PasswordResetinfoScreen = function PasswordResetinfoScreen({ props, darkMode }) {
  return (
    <div className="info-screen-wrapper">
      <div className="password-reset-card">
        <img
          className="info-screen-email-img"
          src={
            darkMode
              ? 'assets/images/onboardingassets/Illustrations/reset_password_successfull_dark.svg'
              : 'assets/images/onboardingassets/Illustrations/reset_password_successfull.svg'
          }
          alt="password lock"
          loading="lazy"
          data-cy="email-image"
        />
        <h1 className="common-auth-section-header">Password has been reset</h1>
        <p className="info-screen-description">
          Your password has been reset successfully, log into ToolJet to continue your session
        </p>
        <ButtonSolid
          variant="secondary"
          onClick={() => props.history.push('/login')}
          className="reset-password-info-btn"
        >
          Back to log in
        </ButtonSolid>
      </div>
    </div>
  );
};
