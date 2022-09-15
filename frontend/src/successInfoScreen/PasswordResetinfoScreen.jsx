import React from 'react';

function PasswordResetinfoScreen({ props }) {
  return (
    <div>
      <div className="email-verification-wrapper">
        <div className="password-reset-card">
          <img
            className="onboarding-page-email-img"
            src={'assets/images/onboarding assets /02 Illustrations /Reset password successfull.svg'}
            alt="email image"
          />
          <h1 className="common-auth-section-header">Passwrod has been reset</h1>
          <p className="onboarding-page-verify--subheading">
            Your password has been reset sucecessfully, log into ToolJet to to continue your session
          </p>

          <button
            className="verify-page-continue-btn  "
            style={{ marginTop: '32px' }}
            onClick={() => props.history.push('/login')}
          >
            <p className="mb-0">Back to log in</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetinfoScreen;
