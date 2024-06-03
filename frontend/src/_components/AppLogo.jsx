import React from 'react';
import Logo from '@assets/images/rocket.svg';
import { retrieveWhiteLabelLogo, fetchWhiteLabelDetails } from '@white-label/whiteLabelling';

export default function AppLogo({ isLoadingFromHeader, className }) {
  const url = retrieveWhiteLabelLogo();

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
