import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers';
import BaseColorSwatches from '@/modules/common/components/BaseColorSwatches';
import { getCssVarValue } from '@/Editor/Components/utils';

const ColorSwatches = (props) => {
  const { value } = props;
  let modifiedValue = props.value;
  if (typeof value === 'string' && value?.includes('var(')) {
    modifiedValue = getCssVarValue(document.documentElement, value);
  }

  return <BaseColorSwatches {...props} value={modifiedValue} />;
};

export default withEditionSpecificComponent(ColorSwatches, 'Appbuilder');
