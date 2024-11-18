import React from 'react';
import OnboardingFormWrapper from '../OnboardingFormWrapper/OnboardingFormWrapper';
import './resources/styles/onboarding-ui-wrapper.styles.scss';

const OnboardingUIWrapper = ({ children: components }) => {
  const isEmptyPath = window.location.pathname == '/';
  const isSetupRoute = window.location.pathname.split('/').pop().toLowerCase() === 'setup';
  const pathEndSegments = window.location.pathname.split('/').filter(Boolean).slice(-2);
  const isInvitationRoute =
    pathEndSegments.length === 2 && pathEndSegments[0] === 'invitations' && pathEndSegments[1]?.length > 0;
  if (isSetupRoute || isInvitationRoute || isEmptyPath) {
    return (
      <div className="onboarding-setup-wrapper">
        <OnboardingFormWrapper>{components}</OnboardingFormWrapper>
      </div>
    );
  }
  return (
    <div className="auth-pages-wrapper">
      <OnboardingFormWrapper>{components}</OnboardingFormWrapper>
    </div>
  );
};

export default OnboardingUIWrapper;
