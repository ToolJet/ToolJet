import React, { useEffect, useState } from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/onboarding-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
import WhiteLabellingFormWrapper from '@/modules/onboarding/components/WhiteLabellingFormWrapper';
import { defaultWhiteLabellingSettings, retrieveWhiteLabelFavicon } from '@white-label/whiteLabelling';
const OnboardingFormWrapper = ({ children: components }) => {
  const whiteLabelLogoTest = retrieveWhiteLabelFavicon();
  const defaultWhiteLabelLogoTest = defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON;
  const isWhiteLabelApplied = !(whiteLabelLogoTest === defaultWhiteLabelLogoTest);
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
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        <Logo />
      </div>
      {components}
    </div>
  );
};

export default OnboardingFormWrapper;
