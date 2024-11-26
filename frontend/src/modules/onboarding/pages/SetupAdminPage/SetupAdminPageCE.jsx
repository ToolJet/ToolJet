import React, { useEffect } from 'react';
import { OnboardingBackgroundWrapper, OnboardingQuestions } from '@/modules/onboarding/components';
import { SetupAdminForm } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';
import useOnboardingStore from '@/modules/onboarding/stores/onboardingStore';
import { shallow } from 'zustand/shallow';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
const PostOnboardingComponent = () => <TJLoader />;

const SetupAdminPageCE = () => {
  const { currentStep, isOnboardingStepsCompleted } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
      isOnboardingStepsCompleted: state.isOnboardingStepsCompleted,
    }),
    shallow
  );
  if (isOnboardingStepsCompleted && PostOnboardingComponent) {
    return <PostOnboardingComponent />;
  } else if (currentStep > 0) {
    return <OnboardingQuestions />;
  }

  return <OnboardingBackgroundWrapper LeftSideComponent={SetupAdminForm} RightSideComponent={GeneralFeatureImage} />;
};

export default SetupAdminPageCE;
