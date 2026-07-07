import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { ResetPasswordForm } from '../ResetPasswordPage/components';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { fetchWhiteLabelDetails } from '@white-label/whiteLabelling';
import { authenticationService } from '@/_services/authentication.service';
import { LinkExpiredCard } from '@/modules/common/components';

const AppResetPasswordPage = () => {
  const { slug, token } = useParams();
  const [tokenStatus, setTokenStatus] = useState('loading'); // 'loading' | 'valid' | 'expired'

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

  useEffect(() => {
    authenticationService
      .verifyResetToken(token)
      .then((data) => setTokenStatus(data.valid ? 'valid' : 'expired'))
      .catch(() => setTokenStatus('valid')); // on network error, let the form handle it
  }, [token]);

  const handleResetSuccess = () => {
    window.location.href = `/applications/${slug}/login?redirectTo=${encodeURIComponent(redirectTo)}`;
  };

  if (tokenStatus === 'loading') return null;

  if (tokenStatus === 'expired') {
    return <OnboardingBackgroundWrapper MiddleComponent={() => <LinkExpiredCard variant="reset" />} />;
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ResetPasswordForm token={token} onResetSuccess={handleResetSuccess} />}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default AppResetPasswordPage;
