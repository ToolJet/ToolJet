import React from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/whitelabelling-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
import { retrieveWhiteLabelLogo, checkWhiteLabelsDefaultState } from '@white-label/whiteLabelling';
const WhiteLabellingFormWrapper = ({ children: components }) => {
  const IMAGE_WIDTH = 36;
  const IMAGE_HEIGHT = 36;
  const whiteLabelLogo = retrieveWhiteLabelLogo();
  const isDefaultWhiteLabel = checkWhiteLabelsDefaultState();
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : '/';
  };
  if (whiteLabelLogo == null) {
    return <div></div>;
  }
  return (
    <div className="white-labelling-form-wrapper">
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        {window.location.pathname != '/setup' && !isDefaultWhiteLabel ? (
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
