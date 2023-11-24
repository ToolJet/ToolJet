import { redirectToDashboard } from '@/_helpers/routes';
import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';

function OnboardingNavbar({ darkMode }) {
  return (
    <div className={`onboarding-navbar container-xl`}>
      <Link onClick={() => redirectToDashboard()}>
        <AppLogo darkMode={darkMode} isLoadingFromHeader={true} />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
