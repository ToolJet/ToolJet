import React from 'react';
import { FxParamTypeMapping } from './utils';
import { Color } from '../CodeBuilder/Elements/Color';
import { Json } from '../CodeBuilder/Elements/Json';
import { Select } from '../CodeBuilder/Elements/Select';
import { Toggle } from '../CodeBuilder/Elements/Toggle';
import { AlignButtons } from '../CodeBuilder/Elements/AlignButtons';
import { Number } from '../CodeBuilder/Elements/Number';
import { BoxShadow } from '../CodeBuilder/Elements/BoxShadow';
import ClientServerSwitch from '../CodeBuilder/Elements/ClientServerSwitch';

const AllElements = {
  Color,
  Json,
  Toggle,
  Select,
  AlignButtons,
  Number,
  BoxShadow,
  ClientServerSwitch,
};

export const DynamicFxTypeRenderer = ({ paramType, ...restProps }) => {
  const componentType = FxParamTypeMapping[paramType];

  const DynamicComponent = AllElements[componentType];

  return <DynamicComponent {...restProps} />;
};
