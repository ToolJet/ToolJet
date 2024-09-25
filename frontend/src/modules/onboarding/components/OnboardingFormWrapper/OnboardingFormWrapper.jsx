import React, { useEffect, useState } from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/onboarding-form-wrapper.styles.scss';
import {
  retrieveWhiteLabelLogo,
  fetchWhiteLabelDetails,
  defaultWhiteLabellingSettings,
} from '@white-label/whiteLabelling';
import { getSubpath } from '@/_helpers/routes';
const OnboardingFormWrapper = ({ children: components }) => {
  const [whiteLabelLogo, setWhiteLableLogo] = useState(null);
  const [imageWidth, setImageWidth] = useState(130);
  const img = new Image();
  const handleLoad = () => {
    const { naturalWidth } = img;
    setImageWidth(naturalWidth < 130 ? naturalWidth : 130);
  };
  useEffect(() => {
    fetchWhiteLabelDetails();
    const data = retrieveWhiteLabelLogo();
    setWhiteLableLogo(data);
  }, []);
  useEffect(() => {
    if (!whiteLabelLogo) return;
    img.src = whiteLabelLogo;
    img.addEventListener('load', handleLoad);
    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [whiteLabelLogo]);
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : '/';
  };
  return (
    <div className="onboarding-form-wrapper">
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        {whiteLabelLogo != '' &&
        window.location.pathname != '/setup' &&
        whiteLabelLogo != defaultWhiteLabellingSettings.WHITE_LABEL_LOGO &&
        imageWidth != null ? (
          <img width={imageWidth} height="26px" src={whiteLabelLogo} />
        ) : (
          <Logo />
        )}
      </div>
      {components}
    </div>
  );
};

export default OnboardingFormWrapper;
