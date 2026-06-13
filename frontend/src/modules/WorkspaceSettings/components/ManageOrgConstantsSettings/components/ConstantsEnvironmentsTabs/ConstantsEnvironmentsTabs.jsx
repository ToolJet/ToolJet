import React from 'react';
import EEConstantsEnvironmentsTabs from '@ee/modules/WorkspaceSettings/components/ConstantsEnvironmentsTabs';

const ConstantsEnvironmentsTabs = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ConstantsEnvironmentsTabs : EEConstantsEnvironmentsTabs;
