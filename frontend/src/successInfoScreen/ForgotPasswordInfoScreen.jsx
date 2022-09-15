import React from 'react';
// forgot password
function ForgotPasswordInfoScreen({ props, email }) {
  return (
    <div>
      <div className="email-verification-wrapper">
        <div className="check-mail-info-card">
          <img
            className="onboarding-page-email-img"
            src={'assets/images/onboarding assets /02 Illustrations /Reset password mail.svg'}
            alt="email image"
          />
          <h1 className="common-auth-section-header">Check your mail</h1>
          <p className="onboarding-page-verify--subheading">
            We’ve sent an email to {email} with a Password reset link. Please click on that link to reset your password
          </p>
          <p className="onboarding-page-verify-spam">Did not receive an email? Check your spam folder</p>
          <div className="separator-onboarding">
            <div className="separator">
              <h2>
                <span>OR</span>
              </h2>
            </div>
          </div>
          <button
            className="verify-page-continue-btn  "
            style={{ marginTop: '26px' }}
            onClick={() => props.history.push('/login')}
          >
            <p className="mb-0">Back to log in</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordInfoScreen;
