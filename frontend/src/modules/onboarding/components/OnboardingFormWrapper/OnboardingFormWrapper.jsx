import React from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/onboarding-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
import WhiteLabellingFormWrapper from '@/modules/onboarding/components/WhiteLabellingFormWrapper';
import { checkWhiteLabelsDefaultState } from '@white-label/whiteLabelling';
const OnboardingFormWrapper = ({ children: components }) => {
  const isWhiteLabelApplied = !checkWhiteLabelsDefaultState();
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : '/';
  };
  if (window.location.pathname != '/setup' && isWhiteLabelApplied == null) {
    return <div></div>;
  }
  if (window.location.pathname != '/setup' && isWhiteLabelApplied) {
    return <WhiteLabellingFormWrapper>{components}</WhiteLabellingFormWrapper>;
  }
  return (
    <div>
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage} data-cy="page-logo">
        <Logo />
      </div>
      {components}
    </div>
  );
};

export default OnboardingFormWrapper;
