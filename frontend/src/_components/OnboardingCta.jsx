import React from 'react';
import { ShowLoading } from '@/_components';

function OnboardingCta({ isLoading }) {
  return (
    <>
      {isLoading && (
        <div className="loader-wrapper">
          <ShowLoading />
        </div>
      )}

      {!isLoading && (
        <div className="onboarding-cta-wrapper">
          <img src="assets/images/onboardingassets/Illustrations/cta.png" className="onboarding-cta-image"></img>
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
              <img className="byjus-img" src="/assets/images/clients/Byju.png"></img>
              <img className="orange-img" src="/assets/images/clients/orange.png"></img>
              <img className="sequoia-img" src="/assets/images/clients/Sequoia.png"></img>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OnboardingCta;
