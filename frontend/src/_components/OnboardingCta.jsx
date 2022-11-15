import React from 'react';

function OnboardingCta() {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <>
      <div className="onboarding-cta-wrapper">
        <div className="onboarding-cta-image-wrapper">
          <img
            src={
              darkMode
                ? 'assets/images/onboardingassets/Illustrations/cta_dark.png'
                : 'assets/images/onboardingassets/Illustrations/cta_light.png'
            }
            className="onboarding-cta-image"
          ></img>
        </div>
        <div className="common-auth-testimonial-wrapper">
          <p className="common-auth-testimonial">
            “We definitely wanted to invest in low-code technology to ensure our razor focus is on bringing feature
            richness, experience and proven scale -
          </p>
          <div className="onboarding-testimonial-container">
            <img
              className="onboarding-testimonial-img"
              alt="byjus vp of engineering ritesh dhoot"
              src="../../assets/images/onboardingassets/images/vp.jpeg"
            />
            <div>
              <p className="py-0 testimonial-name">Ritesh Dhoot</p>
              <p className="testimonial-position">Former VP of Engineering, Byju’s</p>
            </div>
          </div>
          <div className="onboarding-clients">
            <img
              className="byjus-img"
              src={darkMode ? '/assets/images/clients/Byju_dark.png' : '/assets/images/clients/Byju.png'}
            ></img>
            <img
              className="orange-img"
              src={darkMode ? '/assets/images/clients/orange_dark.png' : '/assets/images/clients/orange.png'}
            ></img>
            <img
              className="sequoia-img"
              src={darkMode ? '/assets/images/clients/Sequoia_dark.png' : '/assets/images/clients/Sequoia.png'}
            ></img>
          </div>
        </div>
      </div>
    </>
  );
}

export default OnboardingCta;
