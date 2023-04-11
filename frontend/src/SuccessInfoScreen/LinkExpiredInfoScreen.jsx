import React from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import { useNavigate } from 'react-router-dom';

export const LinkExpiredInfoScreen = function LinkExpiredInfoScreen({ show = true }) {
  const navigate = useNavigate();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="info-screen-wrapper">
      <div className="link-expired-card">
        <img
          className="info-screen-email-img"
          src={
            darkMode
              ? 'assets/images/onboardingassets/Illustrations/verification_failed_dark.svg'
              : 'assets/images/onboardingassets/Illustrations/verification_failed.svg'
          }
          alt="email image"
          loading="lazy"
          data-cy="email-image"
        />
        <h1 className="common-auth-section-header" data-cy="onboarding-page-header">
          Invalid verification link
        </h1>
        <p className="info-screen-description" data-cy="onboarding-page-description">
          This verification link is invalid.
        </p>
        {show && (
          <ButtonSolid
            variant="secondary"
            className="link-expired-info-btn"
            onClick={() => navigate('/signup')}
            data-cy="back-to-signup-button"
          >
            Back to signup
          </ButtonSolid>
        )}
      </div>
    </div>
  );
};
