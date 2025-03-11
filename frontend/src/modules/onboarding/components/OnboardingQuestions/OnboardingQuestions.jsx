import React from 'react';
import { WorkspaceNameForm, DynamicFeatureImage } from './components';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import { BaseOnboardingQuestions } from '@/modules/common/components';

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

export default withEditionSpecificComponent(OnboardingQuestions, 'onboarding');
