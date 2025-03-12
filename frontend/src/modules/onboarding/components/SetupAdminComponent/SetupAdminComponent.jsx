import React from 'react';
import { OnboardingBackgroundWrapper, OnboardingQuestions } from '@/modules/onboarding/components';
import useOnboardingStore from '@/modules/common/helpers/onboardingStoreHelper';
import { shallow } from 'zustand/shallow';
import { BaseSetupAdminPage } from '@/modules/common/components';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const SetupAdminPageComponent = () => {
  const { currentStep } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
    }),
    shallow
  );
  const onboardingStepContent = () => {
    if (currentStep > 0) {
      return <OnboardingQuestions />;
    }
    return null;
  };

  return <BaseSetupAdminPage onboardingStepContent={onboardingStepContent()} />;
};

export default withEditionSpecificComponent(SetupAdminPageComponent, 'onboarding');
