import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';

function OnboardingNavbar() {
  return (
    <div className="onboarding-navbar container-xl">
      <Link to="/">
        <AppLogo isLoadingFromHeader={true} />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
