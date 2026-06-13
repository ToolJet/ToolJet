import React from 'react';
import EEModuleEditorBanner from '@ee/modules/Modules/components/ModuleEditorBanner';

const ModuleEditorBanner = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleEditorBanner : EEModuleEditorBanner;
