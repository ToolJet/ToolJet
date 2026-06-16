import React from 'react';
import EEModuleContainerInspector from '@ee/modules/Modules/components/ModuleContainerInspector';

const ModuleContainerInspector = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleContainerInspector : EEModuleContainerInspector;
