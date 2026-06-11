import React from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/whitelabelling-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
const WhiteLabellingFormWrapper = ({ children: components, whiteLabelFavIcon, isWhiteLabelApplied }) => {
  const IMAGE_WIDTH = 36;
  const IMAGE_HEIGHT = 36;
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : '/';
  };
  // Not showing empty div to avoid page crashing
  if (whiteLabelFavIcon == null) {
    console.error('White label favicon is not set');
  }
  return (
    <div className="white-labelling-form-wrapper">
      <div className="tooljet-header cursor-pointer" onClick={redirectToLoginPage}>
        {window.location.pathname != '/setup' && isWhiteLabelApplied && whiteLabelFavIcon ? (
          <img width={IMAGE_WIDTH} height={IMAGE_HEIGHT} src={whiteLabelFavIcon} />
        ) : (
          <Logo />
        )}
      </div>
      {components}
    </div>
  );
};

export default WhiteLabellingFormWrapper;
