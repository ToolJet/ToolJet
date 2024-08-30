import React from 'react';
import { Step1, Step2, Step3 } from './resources/images';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store.js';
import useInvitationsStore from '@/modules/onboarding/stores/invitations.store.js';
import { shallow } from 'zustand/shallow';
import './resources/styles/dynamic-feature-image.styles.scss';

const DynamicFeatureImage = () => {
  const { initiatedInvitedUserOnboarding } = useInvitationsStore(
    (state) => ({
      initiatedInvitedUserOnboarding: state.initiatedInvitedUserOnboarding,
    }),
    shallow
  );
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return initiatedInvitedUserOnboarding ? (
    <RenderInvitedUserFeatureImage darkMode={darkMode} />
  ) : (
    <RenderSetupAdminFeatureImage darkMode={darkMode} />
  );
};

const RenderInvitedUserFeatureImage = ({ darkMode }) => {
  const { currentStep } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
    }),
    shallow
  );

  const StepImage = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 darkMode={darkMode} />;
      case 3:
        return <Step3 darkMode={darkMode} />;
      default:
        return <></>;
    }
  };

  return (
    <div className="dynamic-feature-image">
      <StepImage />
    </div>
  );
};

const RenderSetupAdminFeatureImage = ({ darkMode }) => {
  const { currentStep } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
    }),
    shallow
  );

  const StepImage = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 darkMode={darkMode} />;
      case 4:
        return <Step3 darkMode={darkMode} />;
      default:
        return <></>;
    }
  };

  return (
    <div className="dynamic-feature-image">
      <StepImage />
    </div>
  );
};

export default DynamicFeatureImage;
