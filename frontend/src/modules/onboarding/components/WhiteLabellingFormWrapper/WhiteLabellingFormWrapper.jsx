import React, { useEffect, useState } from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/whitelabelling-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
import { defaultWhiteLabellingSettings, retrieveWhiteLabelFavicon } from '@white-label/whiteLabelling';
const WhiteLabellingFormWrapper = ({ children: components }) => {
  const IMAGE_WIDTH = 36;
  const IMAGE_HEIGHT = 36;
  const [whiteLabelLogo, setWhiteLabelLogo] = useState(null);
  useEffect(() => {
    // Note : Currently, We are using favicon for white labelling in all the onboarding flow pages
    const data = retrieveWhiteLabelFavicon();
    setWhiteLabelLogo(data);
  }, []);
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : '/';
  };
  if (whiteLabelLogo == null) {
    return <div></div>;
  }
  return (
    <div className="white-labelling-form-wrapper">
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        {whiteLabelLogo != '' &&
        window.location.pathname != '/setup' &&
        whiteLabelLogo != defaultWhiteLabellingSettings.WHITE_LABEL_LOGO ? (
          <img width={IMAGE_WIDTH} height={IMAGE_HEIGHT} src={whiteLabelLogo} />
        ) : (
          <Logo />
        )}
      </div>
      {components}
    </div>
  );
};

export default WhiteLabellingFormWrapper;
