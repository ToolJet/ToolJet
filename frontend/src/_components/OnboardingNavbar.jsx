import React from 'react';
import { Link } from 'react-router-dom';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';

function OnboardingNavbar({ darkMode }) {
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;
  return (
    <div className={`onboarding-navbar container-xl`}>
      <Link to="/">
        <Logo height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
