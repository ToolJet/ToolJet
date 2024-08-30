import React, { useEffect, useState } from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/onboarding-form-wrapper.styles.scss';
import {
  retrieveWhiteLabelLogo,
  fetchWhiteLabelDetails,
  defaultWhiteLabellingSettings,
} from '@white-label/whiteLabelling';

const OnboardingFormWrapper = ({ children: components }) => {
  const [whiteLabelLogo, setWhiteLableLogo] = useState('');
  useEffect(() => {
    fetchWhiteLabelDetails();
    setWhiteLableLogo(retrieveWhiteLabelLogo());
  }, [whiteLabelLogo]);
  return (
    <div className="onboarding-form-wrapper">
      <div className="tooljet-header">
        {whiteLabelLogo != '' &&
        window.location.pathname != '/setup' &&
        whiteLabelLogo != defaultWhiteLabellingSettings.WHITE_LABEL_LOGO ? (
          <img width="130" height="26" src={whiteLabelLogo} />
        ) : (
          <Logo />
        )}
      </div>
      {components}
    </div>
  );
};

export default OnboardingFormWrapper;
