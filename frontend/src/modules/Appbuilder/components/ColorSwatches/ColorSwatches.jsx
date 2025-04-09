import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers';
import BaseColorSwatches from '@/modules/common/components/BaseColorSwatches';

const ColorSwatches = (props) => {
  return <BaseColorSwatches {...props} />;
};

export default withEditionSpecificComponent(ColorSwatches, 'Appbuilder');
