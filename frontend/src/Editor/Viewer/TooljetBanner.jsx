import React from 'react';
import { useAppDataStore } from '@/_stores/appDataStore';
import TooljetLogoIcon from '@/_ui/Icon/solidIcons/TooljetLogoIcon';
import TooljetLogoText from '@/_ui/Icon/solidIcons/TooljetLogoText';

const TooljetBanner = ({ isDarkMode }) => {
  return (
    <div
      className="powered-with-tj"
      onClick={() => {
        const url = `https://tooljet.com/?utm_source=powered_by_banner&utm_medium=${
          useAppDataStore.getState()?.metadata?.instance_id
        }&utm_campaign=self_hosted`;
        window.open(url, '_blank');
      }}
    >
      Built with
      <span className={'powered-with-tj-icon'}>
        <TooljetLogoIcon />
      </span>
      <TooljetLogoText fill={isDarkMode ? '#ECEDEE' : '#11181C'} />
    </div>
  );
};

export default TooljetBanner;
