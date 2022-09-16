import React, { useState } from 'react';
import OnBoardingForm from '../OnBoardingForm/OnBoardingForm';

function VerificationSuccessInfoScreen() {
  const [show, setShow] = useState(false);

  return (
    <div className="page">
      <div className="info-screen-outer-wrap">
        {!show ? (
          <div className="info-screen-wrapper">
            <div className="verification-success-card">
              <img
                className="info-screen-email-img"
                src={'assets/images/onboarding assets /02 Illustrations /Verification successfull.svg'}
                alt="email image"
              />
              <h1 className="common-auth-section-header">Successfully verified email</h1>
              <p className="info-screen-description">
                Your email has been verified successfully. Continue to set up your workspace to start using ToolJet.
              </p>

              <button
                className="onboarding-page-continue-button"
                style={{ margin: '32px auto' }}
                onClick={() => setShow(true)}
              >
                <p className="mb-0">Set up ToolJet</p>
                <img src="assets/images/onboarding assets /01 Icons /Enter.svg" className="onboarding-enter-icon"></img>
              </button>
            </div>
          </div>
        ) : (
          <OnBoardingForm />
        )}
      </div>
    </div>
  );
}

export default VerificationSuccessInfoScreen;
