import React from 'react';
import EEModuleViewerInspector from '@ee/modules/Modules/components/ModuleViewerInspector';

const ModuleViewerInspector = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleViewerInspector : EEModuleViewerInspector;
