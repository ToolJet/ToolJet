import React from 'react';

function OnBoardingBubbles({ formData, page }) {
  return (
    <div className="onboarding-bubbles-wrapper" data-cy="onboarding-progress-bubbles">
      <div
        className={`onboarding-bubbles ${formData.companyName !== '' && 'onboarding-bubbles-selected'} ${
          page === 0 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.role !== '' && 'onboarding-bubbles-selected'} ${
          page === 1 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.companySize !== '' && 'onboarding-bubbles-selected'} ${
          page === 2 && 'onboarding-bubbles-active'
        } `}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.phoneNumber !== '' && 'onboarding-bubbles-selected'} ${
          page === 3 && 'onboarding-bubbles-active'
        } `}
      ></div>
    </div>
  );
}

export default OnBoardingBubbles;
