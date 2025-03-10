import React, { useEffect, useState } from 'react';
import Logo from '@/modules/common/resources/images/Logo';
import './resources/styles/onboarding-form-wrapper.styles.scss';
import { getSubpath } from '@/_helpers/routes';
import WhiteLabellingFormWrapper from '@/modules/onboarding/components/WhiteLabellingFormWrapper';
import { defaultWhiteLabellingSettings, retrieveWhiteLabelFavicon } from '@white-label/whiteLabelling';
const OnboardingFormWrapper = ({ children: components }) => {
  const [isWhiteLabelFaviconApplied, setIsWhiteLabelFaviconApplied] = useState(false);
  const defaultWhiteLabelFavicon = defaultWhiteLabellingSettings.WHITE_LABEL_FAVICON;
  const redirectToLoginPage = () => {
    window.location.href = getSubpath() ? `${getSubpath()}` : '/';
  };
  useEffect(() => {
    const fetchLogo = async () => {
      const logo = await retrieveWhiteLabelFavicon();
      setIsWhiteLabelFaviconApplied(logo !== defaultWhiteLabelFavicon);
    };
    fetchLogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (window.location.pathname != '/setup' && isWhiteLabelFaviconApplied == null) {
    return <div></div>;
  }
  if (window.location.pathname != '/setup' && isWhiteLabelFaviconApplied) {
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
