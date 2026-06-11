import React from 'react';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { SetupAdminForm } from '@/modules/onboarding/pages/SetupAdminPage/components';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';

const BaseSetupAdminPage = ({ onboardingStepContent }) => {
  if (onboardingStepContent ?? null) {
    return onboardingStepContent;
  }
  return <OnboardingBackgroundWrapper LeftSideComponent={SetupAdminForm} RightSideComponent={LoginPageRightPanel} />;
};
export default BaseSetupAdminPage;
