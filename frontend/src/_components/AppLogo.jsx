import React from 'react';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';
import { retrieveWhiteLabelLogo } from '@white-label/whiteLabelling';

export default function AppLogo({ isLoadingFromHeader, className, darkMode = false, viewer = false, organizationId }) {
  const url = retrieveWhiteLabelLogo(organizationId);
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;

  return (
    <>
      {url ? (
        <img src={url} height={26} data-cy="page-logo" />
      ) : (
        <>
          {isLoadingFromHeader ? (
            <Logo height={26} data-cy="page-logo" />
          ) : (
            <img src="assets/images/rocket.svg" className={className} data-cy="page-logo" />
          )}
        </>
      )}
    </>
  );
}
