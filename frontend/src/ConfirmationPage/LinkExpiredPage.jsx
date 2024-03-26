import React from 'react';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { LinkExpiredInfoScreen } from '../SuccessInfoScreen/LinkExpiredInfoScreen';

export const LinkExpiredPage = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true' || false;
  return (
    <div className="page">
      <OnboardingNavbar darkMode={darkMode} />
      <div className="link-expired-info-wrapper">
        <LinkExpiredInfoScreen show={false} />
      </div>
    </div>
  );
};
