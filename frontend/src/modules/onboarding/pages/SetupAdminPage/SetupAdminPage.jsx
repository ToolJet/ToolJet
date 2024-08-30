import React, { useEffect } from 'react';
import { OnboardingBackgroundWrapper, OnboardingQuestions } from '@/modules/onboarding/components';
import { SetupAdminForm } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store.js';
import SetupToolJetPage from '../SetupToolJetPage';
import { shallow } from 'zustand/shallow';

const SetupAdminPage = () => {
  const { currentStep, isSetUpToolJetCompleted, resumeOnboarding } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
      isSetUpToolJetCompleted: state.isSetUpToolJetCompleted,
      resumeOnboarding: state.resumeOnboarding,
    }),
    shallow
  );

  useEffect(() => {
    resumeOnboarding();
  }, []);

  if (!isSetUpToolJetCompleted) {
    return <SetupToolJetPage />;
  } else if (currentStep > 0) {
    return <OnboardingQuestions />;
  } else {
    return <OnboardingBackgroundWrapper LeftSideComponent={SetupAdminForm} RightSideComponent={GeneralFeatureImage} />;
  }
};

export default SetupAdminPage;
