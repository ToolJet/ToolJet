import React from 'react';
import EEModuleManager from '@ee/modules/Modules/components/ModuleManager';

const ModuleManager = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleManager : EEModuleManager;
