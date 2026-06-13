import React from 'react';
import EEModuleWidgetBox from '@ee/modules/Modules/components/ModuleWidgetBox';

const ModuleWidgetBox = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ModuleWidgetBox : EEModuleWidgetBox;
