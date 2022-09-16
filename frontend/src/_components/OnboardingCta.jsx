import React from 'react';

function OnboardingCta() {
  return (
    <div>
      <img src="assets/images/onboarding assets /02 Illustrations /cta.png" className="onboarding-cta-image"></img>
      <p className="common-auth-testimonial">
        “We definitely wanted to invest in low-code technology to ensure our razor focus is on bringing feature
        richness, experience and proven scale -
      </p>
      <div className="onboarding-testimonial-container">
        <img className="onboarding-testimonial-img"></img>
        <div>
          <p className="py-0 testimonial-name">Ritesh Dhoot</p>
          <p className="testimonial-position">VP of Engineering, Byju’s</p>
        </div>
      </div>
      <div className="onboarding-clients">
        <img className="byjus-img" src="/assets/images/clients/Byju.png"></img>
        <img className="orange-img" src="/assets/images/clients/orange.png"></img>
        <img className="sequoia-img" src="/assets/images/clients/Sequoia.png"></img>
      </div>
    </div>
  );
}

export default OnboardingCta;
