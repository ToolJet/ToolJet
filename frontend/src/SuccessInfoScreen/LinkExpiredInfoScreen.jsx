import React from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import { useHistory } from 'react-router-dom';

export const LinkExpiredInfoScreen = function LinkExpiredInfoScreen({ show = true }) {
  const history = useHistory();
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
        />
        <h1 className="common-auth-section-header">Invalid verification link</h1>
        <p className="info-screen-description">This verification link is invalid.</p>
        {show && (
          <ButtonSolid variant="secondary" className="link-expired-info-btn" onClick={() => history.push('/signup')}>
            Back to signup
          </ButtonSolid>
        )}
      </div>
    </div>
  );
};
