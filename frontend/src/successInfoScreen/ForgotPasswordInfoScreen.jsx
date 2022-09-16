import React from 'react';
export const ForgotPasswordInfoScreen = function ForgotPasswordInfoScreen({ props, email }) {
  return (
    <div className="info-screen-wrapper">
      <div className="forget-password-info-card">
        <img
          className="info-screen-email-img"
          src={'assets/images/onboarding assets /02 Illustrations /Reset password mail.svg'}
          alt="email image"
        />
        <h1 className="common-auth-section-header">Check your mail</h1>
        <p className="info-screen-description">
          We’ve sent an email to {email} with a Password reset link. Please click on that link to reset your password
        </p>
        <p className="info-screen-spam-msg">Did not receive an email? Check your spam folder</p>
        <div className="separator-onboarding">
          <div className="separator">
            <h2>
              <span>OR</span>
            </h2>
          </div>
        </div>
        <button className="verify-page-continue-btn" onClick={() => props.history.push('/login')}>
          <p className="mb-0">Back to log in</p>
        </button>
      </div>
    </div>
  );
};
