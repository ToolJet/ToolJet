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
  const [imageWidth, setImageWidth] = useState(null);
  useEffect(() => {
    fetchWhiteLabelDetails();
    setWhiteLableLogo(retrieveWhiteLabelLogo());
  }, []);
  const handleImageWidth = (event) => {
    const { naturalWidth } = event.target;
    setImageWidth(naturalWidth < 130 ? naturalWidth : 130);
  };

  const redirectToLoginPage = () => {
    window.location.href = '/';
  };
  return (
    <div className="onboarding-form-wrapper">
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        {whiteLabelLogo != '' &&
        window.location.pathname != '/setup' &&
        whiteLabelLogo != defaultWhiteLabellingSettings.WHITE_LABEL_LOGO ? (
          <img onLoad={handleImageWidth} width={imageWidth} height="26px" src={whiteLabelLogo} />
        ) : (
          <Logo />
        )}
      </div>
      {components}
    </div>
  );
};

export default OnboardingFormWrapper;
