import React from 'react';
import { useHistory } from 'react-router-dom';

function OnboardingNavbar() {
  const history = useHistory();

  return (
    <div className="onboarding-navbar container-xl">
      <img
        src="assets/images/logo-color.svg"
        height="17.5"
        alt="tooljet logo"
        data-cy="page-logo"
        onClick={() => history.push('/login')}
      />
    </div>
  );
}

export default OnboardingNavbar;
