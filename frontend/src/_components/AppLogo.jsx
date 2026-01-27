import React, { useEffect } from 'react';
import Logo from '@assets/images/tj-logo.svg';
import { retrieveWhiteLabelLogo } from '@white-label/whiteLabelling';
import useStore from '@/AppBuilder/_stores/store';
export default function AppLogo({ height = 26, isLoadingFromHeader, className }) {
  const url = useStore((store) => store.whiteLabelLogo);

  return (
    <>
      {url ? (
        <img
          src={url}
          height={height}
          data-cy="page-logo"
          alt="App Logo"
          onError={(e) => {
            e.currentTarget.onerror = null; // prevent infinite loop
            e.currentTarget.src = 'assets/images/logo-fallback.svg';
          }}
        />
      ) : (
        <>
          {isLoadingFromHeader ? <Logo height={height} data-cy="page-logo" /> : <img src={url} className={className} />}
        </>
      )}
    </>
  );
}
