import React from 'react';
import { WorkspaceNameForm, DynamicFeatureImage } from './components';
import { BaseOnboardingQuestions } from '@/modules/common/components';
import EEOnboardingQuestions from '@ee/modules/onboarding/components/OnboardingQuestions';

const OnboardingQuestions = ({ ...props }) => {
  const renderCurrentStep = () => {
    return <WorkspaceNameForm />;
  };
  return (
    <BaseOnboardingQuestions
      renderCurrentStep={renderCurrentStep}
      DynamicFeatureImage={DynamicFeatureImage}
      {...props}
    />
  );
};

export default process.env.TOOLJET_EDITION === 'ce' ? OnboardingQuestions : EEOnboardingQuestions;
