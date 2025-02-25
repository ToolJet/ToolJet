import React from 'react';
import Logo from '@assets/images/rocket.svg';
import { retrieveWhiteLabelLogo } from '@white-label/whiteLabelling';

export default function AppLogo({ isLoadingFromHeader, className }) {
  const url = retrieveWhiteLabelLogo();

  return (
    <>
      {url ? (
        <img src={url} height={26} data-cy="page-logo" />
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
