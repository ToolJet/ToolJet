import React from 'react';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { SetupAdminForm } from '@/modules/onboarding/pages/SetupAdminPage/components';
import { GeneralFeatureImage } from '@/modules/common/components';

const BaseSetupAdminPage = ({ onboardingStepContent }) => {
  if (onboardingStepContent ?? null) {
    return onboardingStepContent;
  }
  return <OnboardingBackgroundWrapper LeftSideComponent={SetupAdminForm} RightSideComponent={GeneralFeatureImage} />;
};
export default BaseSetupAdminPage;
