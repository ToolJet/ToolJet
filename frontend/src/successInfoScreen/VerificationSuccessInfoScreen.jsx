import React, { useState } from 'react';
import OnBoardingForm from '../OnBoardingForm/OnBoardingForm';

function VerificationSuccessInfoScreen() {
  const [show, setShow] = useState(false);

  return (
    <div className="info-screen-container">
      {!show ? (
        <div className="email-verification-wrapper">
          <div className="email-verification-card verification-success-card">
            <img
              className="onboarding-page-email-img verification-success-page-email-img"
              src={'assets/images/onboarding assets /02 Illustrations /Verification successfull.svg'}
              alt="email image"
            />
            <h1 className="common-auth-section-header">Successfully verified email</h1>
            <p className="onboarding-page-verify--subheading">
              Your email has been verified successfully. Continue to set up your workspace to start using ToolJet.
            </p>

            <button
              className="verify-page-continue-btn verification-success-page-continue-btn"
              style={{ marginTop: '32px' }}
              onClick={() => setShow(true)}
            >
              <p className="mb-0">Set up ToolJet</p>
            </button>
          </div>
        </div>
      ) : (
        <OnBoardingForm />
      )}
    </div>
  );
}

export default VerificationSuccessInfoScreen;
