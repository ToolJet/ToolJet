import React from 'react';
import { Link } from 'react-router-dom';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';
import { redirectToDashboard } from '@/_helpers/routes';

function OnboardingNavbar({ darkMode }) {
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;

  return (
    <div className={`onboarding-navbar container-xl`}>
      <Link onClick={() => redirectToDashboard()}>
        <Logo height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
