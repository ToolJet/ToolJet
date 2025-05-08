import React from 'react';
import { useAppDataStore } from '@/_stores/appDataStore';
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
        <img src={`assets/images/icons/${isDarkMode ? 'logo-dark' : 'logo-light'}.svg`} alt="alert" />
      </span>
    </div>
  );
};

export default TooljetBanner;
