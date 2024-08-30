import React from 'react';
import { CompanyInfoForm, WorkspaceNameForm, DynamicFeatureImage, SampleAppIntroduction } from './components';
import { OnboardingBackgroundWrapper, StartFreeTrial } from '@/modules/onboarding/components';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store.js';
import useInvitationsStore from '@/modules/onboarding/stores/invitations.store.js';
import { shallow } from 'zustand/shallow';

const OnboardingQuestions = () => {
  const { initiatedInvitedUserOnboarding } = useInvitationsStore(
    (state) => ({
      initiatedInvitedUserOnboarding: state.initiatedInvitedUserOnboarding,
    }),
    shallow
  );

  return initiatedInvitedUserOnboarding ? (
    <RenderInvitedUserOnboardingQuestions />
  ) : (
    <RenderSetupAdminOnboardingQuestions />
  );
};

const RenderInvitedUserOnboardingQuestions = () => {
  const { currentStep } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
    }),
    shallow
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoForm />;
      case 2:
        return <WorkspaceNameForm />;
      case 3:
        return <SampleAppIntroduction />;
      default:
        return <CompanyInfoForm />;
    }
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

const RenderSetupAdminOnboardingQuestions = () => {
  const { currentStep } = useOnboardingStore(
    (state) => ({
      currentStep: state.currentStep,
    }),
    shallow
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoForm />;
      case 2:
        return <WorkspaceNameForm />;
      case 4:
        return <SampleAppIntroduction />;
      default:
        return <CompanyInfoForm />;
    }
  };

  if (currentStep === 3) {
    return <StartFreeTrial />;
  }

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
