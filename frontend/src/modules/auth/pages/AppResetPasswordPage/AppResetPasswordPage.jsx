import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { ResetPasswordForm } from '../ResetPasswordPage/components';
import { GeneralFeatureImage } from '@/modules/common/components';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { fetchWhiteLabelDetails } from '@white-label/whiteLabelling';

const AppResetPasswordPage = () => {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [showResponseScreen, setShowResponseScreen] = useState(false);

  useEffect(() => {
    const fetchWhiteLabel = async () => {
      const settings = await fetchWhiteLabelDetails();
      useWhiteLabellingStore.setState({ whiteLabellingSettings: settings });
    };
    fetchWhiteLabel();
  }, []);

  const handleResetSuccess = () => {
    // Redirect to app sign-in page after successful password reset
    window.location.href = `/applications/${slug}/login`;
  };

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ResetPasswordForm token={token} onResetSuccess={handleResetSuccess} />}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default AppResetPasswordPage;
