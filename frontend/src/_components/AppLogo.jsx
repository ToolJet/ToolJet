import React, { useEffect, useState } from 'react';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';
import { useWhiteLabellingStore } from '@/_stores/whiteLabellingStore';

export default function AppLogo({ isLoadingFromHeader, className, darkMode = false, viewer = false, organizationId }) {
  const [url, setUrl] = useState(null);
  const { isWhiteLabelDetailsFetched, whiteLabelLogo } = useWhiteLabellingStore();

  useEffect(() => {
    if (!isWhiteLabelDetailsFetched || viewer) {
      const fetchData = async () => {
        try {
          const { actions } = useWhiteLabellingStore.getState();
          await actions.fetchWhiteLabelDetails(organizationId);
        } catch (error) {
          console.error('Unable to update white label settings', error);
        }
      };
      fetchData();
    }
  }, [isWhiteLabelDetailsFetched, organizationId, viewer]);

  useEffect(() => {
    setUrl(whiteLabelLogo); // Update URL every time whiteLabelLogo changes
  }, [whiteLabelLogo]);

  const Logo = darkMode ? LogoDarkMode : LogoLightMode;

  return (
    <>
      {url ? (
        <img src={url} height={26} data-cy="page-logo" />
      ) : (
        <>
          {isLoadingFromHeader ? (
            <Logo height={26} data-cy="page-logo" />
          ) : (
            <img src="assets/images/rocket.svg" className={className} data-cy="page-logo" />
          )}
        </>
      )}
    </>
  );
}
