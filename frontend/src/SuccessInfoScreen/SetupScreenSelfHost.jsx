import React, { useState, useEffect } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import { ButtonSolid } from '@/_components/AppButton';
import OnbboardingFromSH from '../OnBoardingForm/OnbboardingFromSH';

function SetupScreenSelfHost({ darkMode }) {
  const [showSelfHostOboarding, setShowSelfHostOboarding] = useState(false);

  useEffect(() => {
    const keyDownHandler = (event) => {
      if (event.key === 'Enter') {
        setShowSelfHostOboarding(true);
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, []);

  return (
    <div className="sh-setup-screen-wrapper">
      {!showSelfHostOboarding ? (
        <div className="sh-setup-banner">
          <div className="onboarding-navbar onboarding-navbar-layout setup-page-navbar">
            <div className="tooljet-nav-logo">
              <img
                src="assets/images/logo-color.svg"
                className="onboard-tooljet-logo"
                alt="tooljet-logo"
                data-cy="page-logo"
                loading="lazy"
                onClick={() => history.push('/')}
              />
            </div>
          </div>
          {/* placeholders for image */}
          <div className="sh-setup-banner-inner"></div>
          <div className="sh-setup-sub-banner"></div>
          <div className="sh-setup-card">
            <img src="assets/images/onboardingassets/Illustrations/Dots.svg" alt="tooljet onboarding" loading="lazy" />
            <h1>
              Hello,
              <br /> Welcome to <br />
              <span>ToolJet!</span>
            </h1>
            <p>Let’s set up your workspace to get started with ToolJet</p>
            <ButtonSolid className="sh-setup-button" onClick={() => setShowSelfHostOboarding(true)}>
              <span>Setup ToolJet</span>
              <EnterIcon className="enter-icon-onboard" fill={'#fff'} />
            </ButtonSolid>
          </div>
        </div>
      ) : (
        <OnbboardingFromSH darkMode={darkMode} />
      )}
    </div>
  );
}

export default SetupScreenSelfHost;
