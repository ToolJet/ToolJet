import React from 'react';
import EEModuleViewer from '@ee/modules/Modules/components/ModuleViewer';

const ModuleViewer = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleViewer : EEModuleViewer;
