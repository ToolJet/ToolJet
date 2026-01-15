import React from 'react';
import TooljetLogoText from '@/_ui/Icon/solidIcons/TooljetLogoText';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

const TooljetBanner = ({ isDarkMode, isModuleMode }) => {
  const checkIfLicenseNotValid = useStore((state) => state.checkIfLicenseNotValid, shallow);
  const isLicenseNotValid = checkIfLicenseNotValid();

  if (!isLicenseNotValid || isModuleMode) return;

  return (
    <div
      data-cy="powered-tj-banner"
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
