import React from 'react';
import Logo from '../Editor/Icons/logo.svg';

export default function AppLogo() {
  const url = window.public_config?.CUSTOM_LOGO_URL;
  let isSvg = false;
  const lastPath = url.split('/').pop();
  if (lastPath && lastPath.split('.')[1] === 'svg') {
    isSvg = true;
  }
  return (
    <>
      {url ? (
        <>
          {isSvg ? (
            <svg>
              <image xlinkHref={url} src={url} />
            </svg>
          ) : (
            <img src={url} />
          )}
        </>
      ) : (
        <Logo />
      )}
    </>
  );
}
