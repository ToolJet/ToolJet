import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';
function OnboardingNavbar({ darkMode }) {
  darkMode = darkMode ?? (localStorage.getItem('darkMode') || false);
  return (
    <div className={`onboarding-navbar container-xl ${darkMode && 'theme-dark'}`}>
      <Link to="/">
        <AppLogo />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
