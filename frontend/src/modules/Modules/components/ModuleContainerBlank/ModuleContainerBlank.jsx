import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const ModuleContainerBlank = () => {
  return <></>;
};

export default withEditionSpecificComponent(ModuleContainerBlank, 'Modules');
