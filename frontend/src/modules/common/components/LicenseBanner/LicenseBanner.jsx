import React from 'react';
import EELicenseBanner from '@ee/modules/common/components/LicenseBanner/LicenseBanner';

const LicenseBanner = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? LicenseBanner : EELicenseBanner;
