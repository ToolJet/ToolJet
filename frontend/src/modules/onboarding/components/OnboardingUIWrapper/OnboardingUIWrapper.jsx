import React from 'react';
import OnboardingFormWrapper from '../OnboardingFormWrapper/OnboardingFormWrapper';
import './resources/styles/onboarding-ui-wrapper.styles.scss';

const OnboardingUIWrapper = ({ children: components }) => {
  const pageLocation = window.location.pathname;
  if (pageLocation == '/setup') {
    return (
      <div className="onboarding-setup-wrapper">
        <OnboardingFormWrapper>{components}</OnboardingFormWrapper>
      </div>
    );
  }
  return (
    <div className="auth-pages-wrapper">
      <OnboardingFormWrapper>{components}</OnboardingFormWrapper>
    </div>
  );
};

export default OnboardingUIWrapper;
