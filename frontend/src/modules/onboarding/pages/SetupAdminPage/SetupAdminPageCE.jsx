import React from 'react';
import { OnboardingBackgroundWrapper, OnboardingQuestions } from '@/modules/onboarding/components';
import { SetupAdminForm } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';
import useOnboardingStore from '@/modules/onboarding/stores/onboardingStore';
import { shallow } from 'zustand/shallow';

const SetupAdminPageCE = () => {
  const { currentStep } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
    }),
    shallow
  );

  if (currentStep > 0) {
    return <OnboardingQuestions />;
  }

  return <OnboardingBackgroundWrapper LeftSideComponent={SetupAdminForm} RightSideComponent={GeneralFeatureImage} />;
};

export default SetupAdminPageCE;
