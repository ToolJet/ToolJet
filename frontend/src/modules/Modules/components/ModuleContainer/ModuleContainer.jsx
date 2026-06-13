import React from 'react';
import EEModuleContainer from '@ee/modules/Modules/components/ModuleContainer';

const ModuleContainer = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleContainer : EEModuleContainer;
