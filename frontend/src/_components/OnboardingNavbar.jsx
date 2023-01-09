import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@assets/images/Logomark.svg';
function OnboardingNavbar({ darkMode }) {
  darkMode = darkMode ?? (localStorage.getItem('darkMode') || false);
  return (
    <div className={`onboarding-navbar container-xl ${darkMode && 'theme-dark'}`}>
      <Link to="/">
        <Logo height="23" width="92" alt="tooljet logo" data-cy="page-logo" />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
