import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@assets/images/Logomark.svg';
function OnboardingNavbar() {
  return (
    <div className="onboarding-navbar container-xl">
      <Link to="/">
        <Logo height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
