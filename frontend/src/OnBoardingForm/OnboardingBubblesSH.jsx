import React from 'react';

function OnboardingBubblesSH({ page }) {
  return (
    <div className="onboarding-bubbles-wrapper" data-cy="onboarding-progress-bubbles">
      <div
        className={`onboarding-bubbles ${page >= 2 && 'onboarding-bubbles-selected'} ${
          page === 2 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${page >= 3 && 'onboarding-bubbles-selected'} ${
          page === 3 && 'onboarding-bubbles-active'
        }`}
      ></div>
      <div
        className={`onboarding-bubbles ${page >= 4 && 'onboarding-bubbles-selected'} ${
          page === 4 && 'onboarding-bubbles-active'
        } `}
      ></div>
      <div
        className={`onboarding-bubbles ${page >= 5 && 'onboarding-bubbles-selected'} ${
          page === 5 && 'onboarding-bubbles-active'
        } `}
      ></div>
    </div>
  );
}

export default OnboardingBubblesSH;
