import React from 'react';
import BaseComponentModuleTab from '@/modules/common/components/BaseComponentModuleTab';
import EEComponentModuleTab from '@ee/modules/Appbuilder/components/ComponentModuleTab';

const ComponentModuleTab = (props) => {
  return <BaseComponentModuleTab {...props} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ComponentModuleTab : EEComponentModuleTab;
