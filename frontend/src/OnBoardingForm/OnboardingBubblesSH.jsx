import React from 'react';

function OnboardingBubblesSH({ formData, page }) {
  return (
    <div className="onboarding-bubbles-wrapper">
      <div
        className={`onboarding-bubbles ${formData.companyName !== '' && 'onboarding-bubbles-selected'} ${
          page === 2 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.role !== '' && 'onboarding-bubbles-selected'} ${
          page === 3 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${formData.companySize !== '' && 'onboarding-bubbles-selected'} ${
          page === 4 && 'onboarding-bubbles-active'
        } `}
      ></div>
    </div>
  );
}

export default OnboardingBubblesSH;
