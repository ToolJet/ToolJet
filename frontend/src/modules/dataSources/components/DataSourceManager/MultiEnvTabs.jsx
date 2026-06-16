import React from 'react';
import EEMultiEnvTabs from '@ee/modules/DataSources/components/MultiEnvTabs';

const MultiEnvTabs = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? MultiEnvTabs : EEMultiEnvTabs;
