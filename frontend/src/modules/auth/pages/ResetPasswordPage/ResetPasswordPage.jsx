import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingBackgroundWrapper } from '@/modules/onboarding/components';
import { ResetPasswordForm, ResetPasswordInfoScreen } from './components';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';
import { fetchWhiteLabelDetails } from '@white-label/whiteLabelling';
import { authenticationService } from '@/_services/authentication.service';
import { LinkExpiredCard } from '@/modules/common/components';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [showResponseScreen, setShowResponseScreen] = useState(false);
  const [tokenStatus, setTokenStatus] = useState('loading'); // 'loading' | 'valid' | 'expired'

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
    setShowResponseScreen(true);
  };

  if (tokenStatus === 'loading') return null;

  if (tokenStatus === 'expired') {
    return <OnboardingBackgroundWrapper MiddleComponent={() => <LinkExpiredCard variant="reset" />} />;
  }

  if (showResponseScreen) {
    return <OnboardingBackgroundWrapper MiddleComponent={ResetPasswordInfoScreen} />;
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => <ResetPasswordForm token={token} onResetSuccess={handleResetSuccess} />}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default ResetPasswordPage;
