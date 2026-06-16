import React from 'react';
import EEModuleContainerBlank from '@ee/modules/Modules/components/ModuleContainerBlank';

const ModuleContainerBlank = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleContainerBlank : EEModuleContainerBlank;
