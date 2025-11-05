import React, { useState,useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { ResetPasswordForm, ResetPasswordInfoScreen } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { fetchWhiteLabelDetails  } from '@white-label/whiteLabelling';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [showResponseScreen, setShowResponseScreen] = useState(false);

  useEffect(() => {
  const fetchWhiteLabel = async () => {
    const settings = await fetchWhiteLabelDetails();
    useWhiteLabellingStore.setState({ whiteLabellingSettings: settings });
  };
  fetchWhiteLabel();
}, []);

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
