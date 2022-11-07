import React from 'react';
import { ButtonSolid } from '../_components/AppButton';

export const PasswordResetinfoScreen = function PasswordResetinfoScreen({ props }) {
  return (
    <div className="info-screen-wrapper">
      <div className="password-reset-card">
        <img
          className="info-screen-email-img"
          src={'/assets/images/onboardingassets/Illustrations/Reset password successfull.svg'}
          alt="password lock"
        />
        <h1 className="common-auth-section-header">Passwrod has been reset</h1>
        <p className="info-screen-description">
          Your password has been reset successfully, log into ToolJet to to continue your session
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
