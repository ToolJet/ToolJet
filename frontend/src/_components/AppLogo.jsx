import React, { useEffect } from 'react';
import Logo from '@assets/images/tj-logo.svg';
import { retrieveWhiteLabelLogo } from '@white-label/whiteLabelling';
import useStore from '@/AppBuilder/_stores/store';
export default function AppLogo({ isLoadingFromHeader, className }) {
  const url = useStore((store) => store.whiteLabelLogo);

  return (
    <>
      {url ? (
        <img src={url} height={26} data-cy="page-logo" />
      ) : (
          <>{isLoadingFromHeader ? <Logo height={26} data-cy="page-logo" /> : <img src={url} className={className} />}</>
      )}
    </>
  );
}
