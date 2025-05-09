import React from 'react';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';

const BaseOnboardingQuestions = ({ renderCurrentStep, DynamicFeatureImage }) => {
  return (
    <div className="onboarding-questions-flow">
      <OnboardingBackgroundWrapper
        LeftSideComponent={() => renderCurrentStep()}
        RightSideComponent={DynamicFeatureImage}
      />
    </div>
  );
};

export default BaseOnboardingQuestions;
