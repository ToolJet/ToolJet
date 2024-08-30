import React from 'react';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { PricingComponent, StartTrialForm } from './components';

const StartFreeTrial = () => {
  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={StartTrialForm}
      RightSideComponent={PricingComponent}
      rightSize={8}
      leftSize={4}
    />
  );
};

export default StartFreeTrial;
