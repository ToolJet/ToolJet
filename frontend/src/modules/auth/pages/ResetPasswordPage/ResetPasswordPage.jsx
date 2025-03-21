import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { ResetPasswordForm, ResetPasswordInfoScreen } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [showResponseScreen, setShowResponseScreen] = useState(false);

  const handleResetSuccess = () => {
    setShowResponseScreen(true);
  };

  if (showResponseScreen) {
    return <OnboardingBackgroundWrapper MiddleComponent={ResetPasswordInfoScreen} />;
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ResetPasswordForm token={token} onResetSuccess={handleResetSuccess} />}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default ResetPasswordPage;
