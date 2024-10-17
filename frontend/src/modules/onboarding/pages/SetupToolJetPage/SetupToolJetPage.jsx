import React from 'react';
import {
  OnboardingBackgroundWrapper,
  OnboardingFormInsideWrapper,
  OnboardingUIWrapper,
} from '@/modules/onboarding/components';
import { SubmitButton, FormHeader, FormDescription, GeneralFeatureImage } from '@/modules/common/components';
import { useEnterKeyPress } from '@/modules/common/hooks';
import useOnboardingStore from '@/modules/onboarding/stores/onboardingStore';
import { shallow } from 'zustand/shallow';
import './resources/styles/setup-tooljet-page.styles.scss';

const SetupToolJetPage = () => {
  const headerText = 'Welcome to ToolJet!';
  const description = "Let's set up your admin account and workspace to get started!";
  const { completeToolJetSetup } = useOnboardingStore(
    (state) => ({
      completeToolJetSetup: state.completeToolJetSetup,
    }),
    shallow
  );
  useEnterKeyPress(() => handleClick());

  const handleClick = () => {
    window.open('https://www.tooljet.com/thank-you', '_blank');
    // removed the production environment check for now -> would be required to add later.
    // if (config.ENVIRONMENT === 'production') {
    //   window.open('https://www.tooljet.com/thank-you', '_blank');
    // }
    completeToolJetSetup();
  };
  const LeftSideComponent = () => {
    return (
      <div className="setup-tooljet-page">
        <OnboardingUIWrapper>
          <OnboardingFormInsideWrapper>
            <FormHeader>{headerText}</FormHeader>
            <FormDescription>{description}</FormDescription>
            <SubmitButton className="accept-invite-button" buttonText="Set up ToolJet" onClick={handleClick} />
          </OnboardingFormInsideWrapper>
        </OnboardingUIWrapper>
      </div>
    );
  };
  return <OnboardingBackgroundWrapper LeftSideComponent={LeftSideComponent} RightSideComponent={GeneralFeatureImage} />;
};

export default SetupToolJetPage;
