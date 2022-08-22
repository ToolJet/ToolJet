import React from 'react';
import Logo from '../Editor/Icons/logo.svg';

export default function AppLogo({ isLoadingFromHeader }) {
  const url = window.public_config?.CUSTOM_LOGO_URL;

  return (
    <>
      {url ? (
        <>
          <img src={url} height={26} />
        </>
      ) : (
        <>{isLoadingFromHeader ? <Logo /> : <img src="../../assets/images/logo-color.svg" height={26} />}</>
      )}
    </>
  );
}
