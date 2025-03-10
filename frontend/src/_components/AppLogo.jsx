import React, { useState, useEffect } from 'react';
import Logo from '@assets/images/tj-logo.svg';
import { retrieveWhiteLabelLogo } from '@white-label/whiteLabelling';

export default function AppLogo({ isLoadingFromHeader, className }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const whiteLabelLogo = await retrieveWhiteLabelLogo();
        setUrl(whiteLabelLogo);
      } catch (error) {
        console.error('Error fetching logo:', error);
        setUrl(null);
      }
    };

    fetchLogo();
  }, []);

  return (
    <>
      {url ? (
        <img src={url} height={26} data-cy="page-logo" />
      ) : (
        <>
          {isLoadingFromHeader ? (
            <Logo height={26} data-cy="page-logo" />
          ) : (
                <img src="assets/images/tj-logo.svg" height={26} className={className} />
          )}
        </>
      )}
    </>
  );
}
