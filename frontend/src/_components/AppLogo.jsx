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
          {isLoadingFromHeader ? <Logo /> : <img src="assets/images/Logomark.svg" height={26} className={className} />}
        </>
      )}
    </>
  );
}
