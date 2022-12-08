import React from 'react';
import { Link } from 'react-router-dom';

function OnboardingNavbar() {
  return (
    <div className="onboarding-navbar container-xl">
      <Link to="/">
        <img src="assets/images/logo-color.svg" height="17.5" alt="tooljet logo" data-cy="page-logo" />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
