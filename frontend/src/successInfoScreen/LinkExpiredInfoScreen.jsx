import React from 'react';

function LinkExpiredInfoScreen() {
  return (
    <div>
      <div className="email-verification-wrapper">
        <div className="email-verification-card sucess-info-card">
          <img
            className="onboarding-page-email-img"
            src={'assets/images/onboarding assets /02 Illustrations /Verification failed.svg'}
            alt="email image"
          />
          <h1 className="common-auth-section-header">The verification link has expierd</h1>
          <p className="onboarding-page-verify--subheading">
            The verification link sent your email has been expierd. Please resend the email to get a new verification
            link{' '}
          </p>

          <button
            className="verify-page-continue-btn  "
            style={{ marginTop: '26px' }}
            // onClick={() => setShow(true)}
          >
            <p className="mb-0">Resend verification email</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LinkExpiredInfoScreen;
