import React, { useState } from 'react';
import EnterIcon from '../../assets/images/onboarding assets /01 Icons /Enter';
import OnBoardingForm from '../OnBoardingForm/OnBoardingForm';
import { ButtonSolid } from '../_components/AppButton';

export const VerificationSuccessInfoScreen = function VerificationSuccessInfoScreen() {
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
              <ButtonSolid className="verification-success-info-btn" onClick={() => setShow(true)}>
                Set up ToolJet
                <EnterIcon fill={'#fff'}></EnterIcon>
              </ButtonSolid>
            </div>
          </div>
        ) : (
          <OnBoardingForm />
        )}
      </div>
    </div>
  );
};
