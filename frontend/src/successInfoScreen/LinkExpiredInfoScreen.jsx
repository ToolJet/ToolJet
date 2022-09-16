import React from 'react';

export const LinkExpiredInfoScreen = function LinkExpiredInfoScreen() {
  return (
    <div className="info-screen-wrapper">
      <div className="link-expired-card">
        <img
          className="info-screen-email-img"
          src={'assets/images/onboarding assets /02 Illustrations /Verification failed.svg'}
          alt="email image"
        />
        <h1 className="common-auth-section-header">The verification link has expierd</h1>
        <p className="info-screen-description">
          The verification link sent your email has been expierd. Please resend the email to get a new verification link
        </p>

        <button
          className="verify-page-continue-btn"
          style={{ marginTop: '26px' }}
          // onClick={() => setShow(true)}
        >
          <p className="mb-0">Resend verification email</p>
        </button>
      </div>
    </div>
  );
};
