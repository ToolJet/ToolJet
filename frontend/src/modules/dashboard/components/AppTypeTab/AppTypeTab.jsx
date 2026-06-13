import React from 'react';
import EEAppTypeTab from '@ee/modules/Dashboard/components/AppTypeTab';

const AppTypeTab = () => {
  return <></>;
};
export default process.env.TOOLJET_EDITION === 'ce' ? AppTypeTab : EEAppTypeTab;
