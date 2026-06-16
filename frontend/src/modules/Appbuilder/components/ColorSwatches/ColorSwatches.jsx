import React from 'react';
import BaseColorSwatches from '@/modules/common/components/BaseColorSwatches';
import { getCssVarValue } from '@/AppBuilder/Widgets/utils';
import EEColorSwatches from '@ee/modules/Appbuilder/components/ColorSwatches';

const ColorSwatches = (props) => {
  const { value } = props;
  let modifiedValue = props.value;
  if (typeof value === 'string' && value?.includes('var(')) {
    modifiedValue = getCssVarValue(document.documentElement, value);
  }

  return <BaseColorSwatches {...props} value={modifiedValue} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ColorSwatches : EEColorSwatches;
