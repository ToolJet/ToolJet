import React from 'react';
import { useAppDataStore } from '@/_stores/appDataStore';
import TooljetLogoText from '@/_ui/Icon/solidIcons/TooljetLogoText';
import { shallow } from 'zustand/shallow';
const TooljetBanner = ({ isDarkMode }) => {
  const instanceId = useAppDataStore(
    (state) => ({
      instance_id: state.metadata?.instance_id,
    }),
    shallow
  );

  return (
    <div
      className={`powered-with-tj ${isDarkMode ? 'dark-theme' : ''}`}
      onClick={() => {
        const url = `https://tooljet.com`;
        window.open(url, '_blank');
      }}
    >
      Built with
      <img src="assets/images/tj-logo.svg" />
      <TooljetLogoText fill={isDarkMode ? '#ECEDEE' : '#11181C'} />
    </div>
  );
};

export default TooljetBanner;
