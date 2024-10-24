import React from 'react';
import { useAppDataStore } from '@/_stores/appDataStore';
import TooljetLogoIcon from '@/_ui/Icon/solidIcons/TooljetLogoIcon';
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
      className="powered-with-tj"
      onClick={() => {
        const url = `https://tooljet.com/?utm_source=powered_by_banner&utm_medium=${instanceId}&utm_campaign=self_hosted`;
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
