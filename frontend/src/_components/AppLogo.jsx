import React from 'react';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';

export default function AppLogo({ isLoadingFromHeader, className, darkMode = false }) {
  const url = window.public_config?.WHITE_LABEL_LOGO;
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;

  return (
    <>
      {url ? (
        <img src={url} height={26} />
      ) : (
        <>
          {isLoadingFromHeader ? (
            <Logo height={26} data-cy="page-logo" />
          ) : (
            <img src="assets/images/rocket.svg" className={className} />
          )}
        </>
      )}
    </>
  );
}
