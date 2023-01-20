import React from 'react';
import Logo from '@assets/images/rocket.svg';

export default function AppLogo({ isLoadingFromHeader, className }) {
  const url = window.public_config?.WHITE_LABEL_LOGO;

  return (
    <>
      {url ? (
        <img src={url} height={26} />
      ) : (
        <>
          {isLoadingFromHeader ? (
            <Logo />
          ) : (
            <img src="assets/images/logo-color.svg" height={26} className={className} />
          )}
        </>
      )}
    </>
  );
}
