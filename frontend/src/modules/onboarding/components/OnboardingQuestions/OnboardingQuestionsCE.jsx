import React from 'react';
import { WorkspaceNameForm, DynamicFeatureImage } from './components';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';

const OnboardingQuestions = () => {
  const renderCurrentStep = () => {
    return <WorkspaceNameForm />;
  };

  return (
    <div className="onboarding-questions-flow">
      <OnboardingBackgroundWrapper
        LeftSideComponent={() => renderCurrentStep()}
        RightSideComponent={DynamicFeatureImage}
      />
    </div>
  );
};

export default OnboardingQuestions;
