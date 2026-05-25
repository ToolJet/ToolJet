import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { ResetPasswordForm } from '../ResetPasswordPage/components';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { fetchWhiteLabelDetails } from '@white-label/whiteLabelling';

const AppResetPasswordPage = () => {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [showResponseScreen, setShowResponseScreen] = useState(false);

  // Preserve app redirect context from the email reset link
  const searchParams = new URLSearchParams(window.location.search);
  const redirectToParam = searchParams.get('redirectTo');
  const redirectTo = redirectToParam?.startsWith('/applications/') ? redirectToParam : `/applications/${slug}`;

  useEffect(() => {
    const fetchWhiteLabel = async () => {
      const settings = await fetchWhiteLabelDetails();
      useWhiteLabellingStore.setState({ whiteLabellingSettings: settings });
    };
    fetchWhiteLabel();
  }, []);

  const handleResetSuccess = () => {
    window.location.href = `/applications/${slug}/login?redirectTo=${encodeURIComponent(redirectTo)}`;
  };

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ResetPasswordForm token={token} onResetSuccess={handleResetSuccess} />}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default AppResetPasswordPage;
