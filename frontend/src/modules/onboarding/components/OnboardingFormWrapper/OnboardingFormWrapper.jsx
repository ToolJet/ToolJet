import React from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/onboarding-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
const OnboardingFormWrapper = ({ children: components }) => {
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : `'/'`;
  };
  return (
    <div className="onboarding-form-wrapper">
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        <Logo />
      </div>
      {components}
    </div>
  );
};

export default OnboardingFormWrapper;
