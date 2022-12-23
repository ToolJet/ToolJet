import React from 'react';
import OnboardingCta from './OnboardingCta';

function WrappedCta() {
  return (
    <>
      {!window.public_config?.WHITE_LABEL_TEXT && (
        <div className="common-auth-section-right-wrapper">
          <OnboardingCta />
        </div>
      )}
    </>
  );
}

export default WrappedCta;
