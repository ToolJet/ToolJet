import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers';
import BaseComponentModuleTab from '@/modules/common/components/BaseComponentModuleTab';

const ComponentModuleTab = (props) => {
  return <BaseComponentModuleTab {...props} />;
};

export default withEditionSpecificComponent(ComponentModuleTab, 'Appbuilder');
